import React, { useState, useRef, useEffect } from 'react';
import { Button, Dialog, Input, Message, Loading, Radio, Divider } from '@alifd/next';
import { IPublicModelPluginContext } from '@alilc/lowcode-types';
import { material } from '@alilc/lowcode-engine';
import { generateSchema, generateSchemaWithMaterials, getAvailableMaterials, getDetailedMaterials, mockGenerateSchema } from '../../services/aiService';
import { schema as demoSchema } from './demo';
import './index.less';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'iteration';
  content: string;
  timestamp: number;
  iterationData?: {
    iterationNumber: number;
    completed: boolean;
    hasSchema: boolean;
    schemaSize: number;
    reasoning?: string;
  };
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    try {
      // 调用后端AI服务生成schema
      console.log('=== AI Assistant Backend Request ===');
      console.log('用户输入:', inputValue.trim());
      console.log('AI模式:', aiMode);
      
      // 获取当前项目的schema作为上下文
      const currentSchema = ctx.project.exportSchema('Save' as any);
      console.log('当前项目schema:', currentSchema);
      
      let result;
      
      if (aiMode === 'smart-materials') {
        // 使用智能物料选择接口
        console.log('使用智能物料选择模式');
        
        // 获取详细的物料信息
        const detailedMaterials = await getDetailedMaterials();
        console.log('详细物料信息:', detailedMaterials);
        
        // 调用智能物料选择AI生成schema
        result = await generateSchemaWithMaterials({
          prompt: inputValue.trim(),
          currentSchema,
          materials: detailedMaterials.map(m => m.name), // 传递物料名称列表
        });
      } else {
        // 使用标准接口
        console.log('使用标准模式');
        
        // 获取可用的物料列表
        const materials = await getAvailableMaterials();
        console.log('可用物料:', materials);
        
        // 调用标准AI生成schema
        result = await generateSchema({
          prompt: inputValue.trim(),
          currentSchema,
          materials,
        });
      }
      
      console.log('AI生成结果:', result);
      
      // 处理智能物料选择接口的返回格式
      let schema = null;
      if (aiMode === 'smart-materials' && result.success && result.result && result.result.schema) {
        schema = result.result.schema;
      } else if (result.success && result.schema) {
        schema = result.schema;
      }
      
      if (schema) {
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
          componentsTree: [schema],
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
        
        // 显示迭代过程信息
        const newMessages: ChatMessage[] = [];
        
        // 如果有迭代历史，显示每次迭代的详情
        if (result.result?.iterationHistory && result.result.iterationHistory.length > 0) {
          result.result.iterationHistory.forEach((iteration, index) => {
            const iterationMessage: ChatMessage = {
              id: `iteration_${Date.now()}_${index}`,
              type: 'iteration',
              content: `第 ${iteration.iterationNumber} 次迭代${iteration.completed ? ' (已完成)' : ' (进行中)'}`,
              timestamp: Date.now() + index,
              iterationData: iteration
            };
            newMessages.push(iterationMessage);
          });
        }
        
        // 添加最终成功消息
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1000).toString(),
          type: 'assistant',
          content: `✅ ${result.message || '已成功生成页面，请查看设计器中的变化。'}${aiMode === 'smart-materials' ? ' (智能物料选择模式)' : ' (标准模式)'}\n\n📊 总迭代次数: ${result.result?.iterations || 0}`,
          timestamp: Date.now() + 1000,
        };
        newMessages.push(assistantMessage);
        
        setMessages(prev => [...prev, ...newMessages]);
        Message.success('页面生成成功！');
        
      } else {
        // API调用失败，使用fallback机制
        console.warn('AI API调用失败，使用fallback机制:', result.error);
        
        const fallbackResult = await mockGenerateSchema(inputValue.trim());
        
        if (fallbackResult.success && fallbackResult.schema) {
          // 使用mock数据的导入逻辑
          let currentDocument = ctx.project.getCurrentDocument();
          if (!currentDocument) {
            currentDocument = ctx.project.openDocument({
              componentName: 'Page',
              fileName: 'fallback-page',
            });
          }
          
          const projectSchema = {
            componentsTree: [fallbackResult.schema],
            componentsMap: material.componentsMap as any,
            version: '1.0.0',
            i18n: {},
          };
          
          ctx.project.importSchema(projectSchema as any);
          ctx.project.simulatorHost?.rerender();
          
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: `⚠️ 后端服务暂时不可用，已使用本地模拟数据生成页面。${fallbackResult.message}`,
            timestamp: Date.now(),
          };
          
          setMessages(prev => [...prev, assistantMessage]);
          Message.warning('使用本地模拟数据生成页面');
        } else {
          throw new Error(result.error || fallbackResult.error || '生成失败');
        }
      }
    } catch (error) {
      console.error('AI助手处理失败:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `❌ 处理失败: ${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      Message.error('处理失败，请稍后重试');
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