import React, { useState, useRef, useEffect } from 'react';
import { Button, Dialog, Input, Message, Loading, Radio, Divider } from '@alifd/next';
import { IPublicModelPluginContext } from '@alilc/lowcode-types';
import { material } from '@alilc/lowcode-engine';
import { generateSchema, generateSchemaWithMaterials, generateSchemaStream, generateSchemaWithMaterialsStream, getAvailableMaterials, getDetailedMaterials, mockGenerateSchema, StreamEvent } from '../../services/aiService';
import { schema as demoSchema } from './demo';
import './index.less';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'iteration' | 'streaming';
  content: string;
  timestamp: number;
  iterationData?: {
    iterationNumber: number;
    completed: boolean;
    hasSchema: boolean;
    schemaSize: number;
    reasoning?: string;
  };
  isStreaming?: boolean;
  streamingComplete?: boolean;
  finalSchema?: any;
  finalResult?: any;
}

interface AIAssistantProps {
  ctx: IPublicModelPluginContext;
}

type AIMode = 'standard' | 'smart-materials';

const AIAssistant: React.FC<AIAssistantProps> = ({ ctx }) => {
  const [visible, setVisible] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiMode, setAiMode] = useState<AIMode>('standard');
  const [conversationEnded, setConversationEnded] = useState(false);
  const [pendingSchemas, setPendingSchemas] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastUpdateTimeRef = useRef<number>(0); // 使用ref来存储上次更新时间

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const updateStreamingMessage = (messageId: string, content: string, complete: boolean = false, schema?: any, result?: any) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { 
            ...msg, 
            content, 
            streamingComplete: complete,
            finalSchema: schema || msg.finalSchema,
            finalResult: result || msg.finalResult
          }
        : msg
    ));
  };

  const addIterationMessage = (messageId: string, iterationData: any) => {
    const iterationMessage: ChatMessage = {
      id: `${messageId}_iteration_${iterationData.iterationNumber}`,
      type: 'iteration',
      content: `第 ${iterationData.iterationNumber} 次迭代${iterationData.completed ? ' (已完成)' : ' (进行中)'}`,
      timestamp: Date.now(),
      iterationData,
    };
    
    setMessages(prev => [...prev, iterationMessage]);
  };

  // 应用所有待处理的schema到编辑器
  const applyPendingSchemasToEditor = () => {
    if (pendingSchemas.length === 0) return;

    try {
      // 使用最后一个schema（最新的结果）
      const latestSchema = pendingSchemas[pendingSchemas.length - 1];
      
      // 先检查是否有打开的文档，如果没有则创建一个
      let currentDocument = ctx.project.getCurrentDocument();
      if (!currentDocument) {
        console.log('没有打开的文档，创建新文档...');
        currentDocument = ctx.project.openDocument({
          componentName: 'Page',
          fileName: 'ai-generated-page',
        });
      }
      
      // 构建正确的项目schema结构
      const projectSchema = {
        componentsTree: [latestSchema],
        componentsMap: material.componentsMap as any,
        version: '1.0.0',
        i18n: {},
      };
      
      console.log('准备导入的项目schema:', projectSchema);
      
      // 导入schema到项目
      ctx.project.importSchema(projectSchema as any);
      
      // 触发重新渲染
      ctx.project.simulatorHost?.rerender();
      
      console.log('Schema导入成功');
      Message.success('页面已应用到编辑器！');
      
      // 清空待处理的schemas
      setPendingSchemas([]);
    } catch (error) {
      console.error('应用schema到编辑器失败:', error);
      Message.error('应用到编辑器失败');
    }
  };

  // 结束对话并应用结果
  const endConversationAndApply = () => {
    setConversationEnded(true);
    applyPendingSchemasToEditor();
    
    // 添加结束对话的消息
    const endMessage: ChatMessage = {
      id: `end_${Date.now()}`,
      type: 'assistant',
      content: '🎉 对话已结束，生成的页面已应用到编辑器中！',
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, endMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);
    setConversationEnded(false);

    // 创建流式响应消息
    const streamingMessageId = `streaming_${Date.now()}`;
    const streamingMessage: ChatMessage = {
      id: streamingMessageId,
      type: 'streaming',
      content: '正在生成...',
      timestamp: Date.now(),
      isStreaming: true,
      streamingComplete: false,
    };

    setMessages(prev => [...prev, streamingMessage]);

    try {
      console.log('=== AI Assistant Streaming Request ===');
      console.log('用户输入:', inputValue.trim());
      console.log('AI模式:', aiMode);
      
      // 获取当前项目的schema作为上下文
      const currentSchema = ctx.project.exportSchema('Save' as any);
      console.log('当前项目schema:', currentSchema);
      
      let streamingContent = '';
      
      const handleStreamEvent = (event: StreamEvent) => {
        console.log('收到流式事件:', event);
        
        switch (event.type) {
          case 'start':
            streamingContent = event.message || '开始生成...';
            updateStreamingMessage(streamingMessageId, streamingContent);
            break;
            
          case 'progress':
            // 检查是否是迭代过程中的流式文本
            if (event.iterationNumber && event.message) {
              // 迭代过程中的流式文本 - 使用节流处理避免过度更新
              if (event.streaming) {
                // 流式文本累积显示，但限制更新频率
                const currentTime = Date.now();
                if (currentTime - lastUpdateTimeRef.current > 100) { // 100ms节流
                  streamingContent += event.message;
                  updateStreamingMessage(streamingMessageId, streamingContent);
                  lastUpdateTimeRef.current = currentTime;
                }
              } else {
                // 非流式消息直接替换
                streamingContent = event.message;
                updateStreamingMessage(streamingMessageId, streamingContent);
              }
            } else {
              // 普通进度消息 - 直接使用完整的消息内容
              streamingContent = event.message || '';
              updateStreamingMessage(streamingMessageId, streamingContent);
            }
            break;
            
          case 'iteration':
            if (event.iterationNumber) {
              // 如果是流式迭代消息，添加迭代标识和实际内容
              if (event.streaming && event.message) {
                // 在当前流式消息中添加迭代标识和AI返回的内容
                // 避免重复累积，使用节流处理
                const newContent = `\n\n🔄 第 ${event.iterationNumber} 次迭代优化:\n${event.message}`;
                if (!streamingContent.includes(`第 ${event.iterationNumber} 次迭代优化`)) {
                  streamingContent += newContent;
                  updateStreamingMessage(streamingMessageId, streamingContent);
                }
              } else {
                // 非流式迭代消息，创建独立的迭代消息
                addIterationMessage(streamingMessageId, {
                  iterationNumber: event.iterationNumber,
                  completed: event.completed || false,
                  hasSchema: event.hasSchema || false,
                  schemaSize: event.schemaSize || 0,
                  reasoning: event.reasoning,
                });
              }
            }
            break;
            
          case 'complete':
            streamingContent += '\n✅ 生成完成';
            
            // 正确提取schema
            const finalSchema = event.schema || event.result?.schema;
            updateStreamingMessage(streamingMessageId, streamingContent, true, finalSchema, event.result);
            
            // 保存最终结果，等待对话结束后应用
            if (finalSchema) {
              setPendingSchemas(prev => [...prev, finalSchema]);
            }
            break;
            
          case 'error':
            streamingContent += '\n❌ 生成失败: ' + (event.message || event.error);
            updateStreamingMessage(streamingMessageId, streamingContent, true);
            break;
        }
      };
      
      if (aiMode === 'smart-materials') {
        console.log('使用智能物料选择流式模式');
        
        const detailedMaterials = await getDetailedMaterials();
        console.log('详细物料信息:', detailedMaterials);
        
        await generateSchemaWithMaterialsStream({
          prompt: inputValue.trim(),
          currentSchema,
          materials: detailedMaterials.map(m => m.name),
        }, handleStreamEvent);
      } else {
        console.log('使用标准流式模式');
        
        const materials = await getAvailableMaterials();
        console.log('可用物料:', materials);
        
        await generateSchemaStream({
          prompt: inputValue.trim(),
          currentSchema,
          materials,
        }, handleStreamEvent);
      }
      
    } catch (error) {
      console.error('流式AI生成失败:', error);
      
      // 更新流式消息显示错误
      updateStreamingMessage(streamingMessageId, '❌ 生成失败: ' + (error as Error).message, true);
      
      // 降级到非流式模式
      try {
        console.log('降级到非流式模式');
        let result;
        
        if (aiMode === 'smart-materials') {
          const detailedMaterials = await getDetailedMaterials();
          result = await generateSchemaWithMaterials({
            prompt: inputValue.trim(),
            currentSchema: ctx.project.exportSchema('Save' as any),
            materials: detailedMaterials.map(m => m.name),
          });
        } else {
          const materials = await getAvailableMaterials();
          result = await generateSchema({
            prompt: inputValue.trim(),
            currentSchema: ctx.project.exportSchema('Save' as any),
            materials,
          });
        }
        
        if (result.success) {
          let schema = null;
          if (aiMode === 'smart-materials' && result.result?.schema) {
            schema = result.result.schema;
          } else if (result.schema) {
            schema = result.schema;
          }
          
          if (schema) {
            setPendingSchemas(prev => [...prev, schema]);
            updateStreamingMessage(streamingMessageId, '✅ 使用非流式模式生成完成', true, schema, result.result);
          }
        } else {
          throw new Error(result.error || '生成失败');
        }
      } catch (fallbackError) {
        console.error('降级模式也失败:', fallbackError);
        updateStreamingMessage(streamingMessageId, '❌ 所有生成方式都失败了', true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setPendingSchemas([]);
    setConversationEnded(false);
  };



  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Button 
        type="secondary"
        onClick={() => setVisible(true)}
        style={{ marginRight: 8 }}
      >
        AI助手
      </Button>
      
      <Dialog
        visible={visible}
        onClose={() => setVisible(false)}
        title="AI助手 - 智能生成页面"
        style={{ width: 600, height: 500 }}
        footer={null}
        className="ai-assistant-dialog"
      >
        <div className="ai-chat-container">
          <div className="ai-chat-header">
            <div className="ai-chat-header-content">
              <span>描述您想要的页面，AI将为您生成对应的界面</span>
              <Button 
                text 
                size="medium" 
                onClick={handleClearChat}
                disabled={messages.length === 0}
              >
                清空对话
              </Button>
            </div>
            
            <Divider style={{ margin: '8px 0' }} />
            
            <div className="ai-mode-selector">
               <span style={{ marginRight: 12, fontSize: 13, color: '#666' }}>AI模式：</span>
               <Radio.Group 
                 value={aiMode} 
                 onChange={(value) => setAiMode(value as AIMode)}
                 disabled={loading}
                 size="medium"
               >
                 <Radio value="standard">标准模式</Radio>
                 <Radio value="smart-materials">智能物料选择</Radio>
               </Radio.Group>
             </div>
            
            <div className="ai-mode-description">
              {aiMode === 'standard' ? (
                <span style={{ fontSize: 12, color: '#999' }}>
                  使用预设物料库生成页面
                </span>
              ) : (
                <span style={{ fontSize: 12, color: '#999' }}>
                  AI智能分析并选择最适合的物料组合
                </span>
              )}
            </div>

            {/* 对话结束和应用按钮 */}
            {pendingSchemas.length > 0 && !conversationEnded && (
              <div style={{ marginTop: 8 }}>
                <Button 
                  type="primary" 
                  size="small"
                  onClick={endConversationAndApply}
                  disabled={loading}
                >
                  结束对话并应用到编辑器
                </Button>
                <span style={{ marginLeft: 8, fontSize: 12, color: '#666' }}>
                  ({pendingSchemas.length} 个待应用的结果)
                </span>
              </div>
            )}
          </div>
          
          <div className="ai-chat-messages">
            {messages.length === 0 && (
              <div className="ai-chat-welcome">
                <p>👋 您好！我是AI助手</p>
                <p>请告诉我您想要创建什么样的页面，例如：</p>
                <ul>
                  <li>"创建一个用户登录页面"</li>
                  <li>"生成一个商品列表页面，包含搜索和筛选功能"</li>
                  <li>"制作一个数据统计仪表板"</li>
                </ul>
                <p style={{ fontSize: 12, color: '#999', marginTop: 16 }}>
                  💡 提示：AI会以流式方式展示生成过程，只有在您点击"结束对话并应用到编辑器"后，结果才会应用到页面编辑器中。
                </p>
              </div>
            )}
            
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`ai-chat-message ${message.type}`}
              >
                <div className="ai-chat-message-content">
                  <div className="ai-chat-message-text">
                    {message.content}
                    {message.type === 'streaming' && message.isStreaming && !message.streamingComplete && (
                      <span className="streaming-indicator">...</span>
                    )}
                    {/* 显示最终的schema内容 */}
                    {message.type === 'streaming' && message.streamingComplete && message.finalSchema && (
                      <div style={{ marginTop: 12, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>📋 生成的Schema:</div>
                        <pre style={{ fontSize: 11, color: '#333', whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}>
                          {JSON.stringify(message.finalSchema, null, 2)}
                        </pre>
                      </div>
                    )}
                    {message.type === 'iteration' && message.iterationData && (
                      <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                        <div>📊 Schema大小: {message.iterationData.schemaSize} 字符</div>
                        <div>✅ 状态: {message.iterationData.hasSchema ? '已生成Schema' : '未生成Schema'}</div>
                        {message.iterationData.reasoning && (
                          <div style={{ marginTop: 4, fontStyle: 'italic' }}>
                            💭 推理: {message.iterationData.reasoning}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="ai-chat-message-time">
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="ai-chat-message assistant">
                <div className="ai-chat-message-content">
                  <div className="ai-chat-loading">
                    <Loading size="medium" />
                    <span>AI正在为您生成页面...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="ai-chat-input">
            <Input.TextArea
              value={inputValue}
              onChange={setInputValue}
              onKeyPress={handleKeyPress}
              placeholder="描述您想要的页面..."
              rows={3}
              disabled={loading}
            />
            <div className="ai-chat-input-actions">
              <Button 
              type="primary" 
              size="medium"
              onClick={handleSendMessage}
              loading={loading}
              disabled={!inputValue.trim() || loading}
            >
              发送
            </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default AIAssistant;