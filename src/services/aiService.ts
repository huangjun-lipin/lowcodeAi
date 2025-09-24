import { request } from '@umijs/max';

export interface GenerateSchemaRequest {
  prompt: string;
  currentSchema?: any;
  materials?: string[];
}

export interface GenerateSchemaResponse {
  success: boolean;
  message: string;
  schema?: any;
  error?: string;
}

/**
 * 调用AI生成schema的API
 * @param data 请求数据
 * @returns Promise<GenerateSchemaResponse>
 */
export async function generateSchema(data: GenerateSchemaRequest): Promise<GenerateSchemaResponse> {
  try {
    const response = await fetch('http://localhost:3001/api/ai/generate-schema', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('AI生成schema失败:', error);
    return {
      success: false,
      message: '生成失败，请稍后重试',
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

/**
 * 获取可用的物料列表
 * @returns Promise<string[]>
 */
export async function getAvailableMaterials(): Promise<string[]> {
  try {
    const response = await fetch('http://localhost:3001/api/ai/materials', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.materials || [];
  } catch (error) {
    console.error('获取物料列表失败:', error);
    // 返回默认的物料列表
    return [
      'NextButton',
      'NextInput',
      'NextForm',
      'NextFormItem',
      'NextSelect',
      'NextCheckbox',
      'NextRadio',
      'NextTable',
      'NextCard',
      'NextTabs',
      'NextDialog',
      'NextRow',
      'NextCol',
      'NextBox'
    ];
  }
}

/**
 * 模拟AI生成schema的函数（用于开发测试）
 * 实际部署时应该连接到真实的deepseek API
 */
export async function mockGenerateSchema(prompt: string): Promise<GenerateSchemaResponse> {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 根据提示词生成简单的schema示例
  let schema;
  
  if (prompt.includes('登录') || prompt.includes('login')) {
    schema = {
      componentName: 'Page',
      id: `node_${Date.now()}`,
      props: {
        style: {
          height: '100%'
        }
      },
      fileName: '/',
      dataSource: {
        list: []
      },
      state: {},
      css: '',
      lifeCycles: {},
      methods: {},
      hidden: false,
      title: '登录页面',
      isLocked: false,
      condition: true,
      conditionGroup: '',
      children: [
        {
          componentName: 'Form',
          id: `form_${Date.now()}`,
          props: {
            labelCol: { span: 6 },
            wrapperCol: { span: 18 },
            style: {
              maxWidth: '400px',
              margin: '50px auto',
              padding: '20px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px'
            }
          },
          children: [
            {
              componentName: 'FormItem',
              id: `formitem_username_${Date.now()}`,
              props: {
                label: '用户名',
                required: true,
              },
              children: [
                {
                  componentName: 'Input',
                  id: `input_username_${Date.now()}`,
                  props: {
                    placeholder: '请输入用户名',
                  },
                },
              ],
            },
            {
              componentName: 'FormItem',
              id: `formitem_password_${Date.now()}`,
              props: {
                label: '密码',
                required: true,
              },
              children: [
                {
                  componentName: 'Input',
                  id: `input_password_${Date.now()}`,
                  props: {
                    htmlType: 'password',
                    placeholder: '请输入密码',
                  },
                },
              ],
            },
            {
              componentName: 'FormItem',
              id: `formitem_button_${Date.now()}`,
              props: {
                wrapperCol: { offset: 6, span: 18 },
              },
              children: [
                {
                  componentName: 'Button',
                  id: `button_login_${Date.now()}`,
                  props: {
                    type: 'primary',
                    children: '登录',
                    style: {
                      width: '100%'
                    }
                  },
                },
              ],
            },
          ],
        },
      ],
    };
  } else if (prompt.includes('列表') || prompt.includes('表格')) {
    schema = {
      componentName: 'Page',
      id: `node_${Date.now()}`,
      props: {
        style: {
          height: '100%',
          padding: '20px'
        }
      },
      fileName: '/',
      dataSource: {
        list: []
      },
      state: {},
      css: '',
      lifeCycles: {},
      methods: {},
      hidden: false,
      title: '列表页面',
      isLocked: false,
      condition: true,
      conditionGroup: '',
      children: [
        {
          componentName: 'Table',
          id: `table_${Date.now()}`,
          props: {
            dataSource: [
              { key: '1', name: '张三', age: 32, address: '北京市朝阳区' },
              { key: '2', name: '李四', age: 28, address: '上海市浦东新区' },
              { key: '3', name: '王五', age: 35, address: '广州市天河区' }
            ],
            columns: [
              {
                title: '姓名',
                dataIndex: 'name',
                key: 'name',
              },
              {
                title: '年龄',
                dataIndex: 'age',
                key: 'age',
              },
              {
                title: '地址',
                dataIndex: 'address',
                key: 'address',
              },
            ],
          },
        },
      ],
    };
  } else {
    schema = {
      componentName: 'Page',
      id: `node_${Date.now()}`,
      props: {
        style: {
          height: '100%',
          padding: '20px'
        }
      },
      fileName: '/',
      dataSource: {
        list: []
      },
      state: {},
      css: '',
      lifeCycles: {},
      methods: {},
      hidden: false,
      title: '默认页面',
      isLocked: false,
      condition: true,
      conditionGroup: '',
      children: [
        {
          componentName: 'Button',
          id: `button_${Date.now()}`,
          props: {
            type: 'primary',
            children: '点击按钮',
            style: {
              margin: '20px'
            }
          },
        },
      ],
    };
  }

  return {
    success: true,
    message: `已根据您的需求"${prompt}"生成页面`,
    schema,
  };
}