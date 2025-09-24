export const schema={
    "componentName": "Page",
    "id": "node_1758713050748",
    "props": {
        "style": {
            "height": "100%",
            "padding": "20px"
        }
    },
    "fileName": "/",
    "dataSource": {
        "list": [
            {
                "type": "fetch",
                "id": "userList",
                "isInit": true,
                "options": {
                    "uri": "/api/users",
                    "method": "GET",
                    "params": {},
                    "headers": {},
                    "isCors": true,
                    "timeout": 5000
                },
                "shouldFetch": {
                    "type": "JSFunction",
                    "value": "function() { return true; }"
                }
            }
        ]
    },
    "state": {
        "searchParams": {
            "type": "JSExpression",
            "value": "{}"
        },
        "pagination": {
            "type": "JSExpression",
            "value": "{\n  current: 1,\n  pageSize: 10,\n  total: 0\n}"
        }
    },
    "css": "",
    "lifeCycles": {
        "componentDidMount": {
            "type": "JSFunction",
            "value": "function() {\n  this.fetchUserList();\n}"
        }
    },
    "methods": {
        "fetchUserList": {
            "type": "JSFunction",
            "value": "function() {\n  const { searchParams, pagination } = this.state;\n  this.dataSourceMap.userList\n    .load({\n      ...searchParams,\n      page: pagination.current,\n      size: pagination.pageSize\n    })\n    .then(res => {\n      this.setState({\n        pagination: {\n          ...pagination,\n          total: res.total\n        }\n      });\n    });\n}",
            "params": []
        },
        "handleSearch": {
            "type": "JSFunction",
            "value": "function(values) {\n  this.setState({\n    searchParams: values,\n    pagination: {\n      ...this.state.pagination,\n      current: 1\n    }\n  }, () => {\n    this.fetchUserList();\n  });\n}",
            "params": [
                "values"
            ]
        },
        "handleTableChange": {
            "type": "JSFunction",
            "value": "function(pagination) {\n  this.setState({\n    pagination: {\n      ...this.state.pagination,\n      current: pagination.current,\n      pageSize: pagination.pageSize\n    }\n  }, () => {\n    this.fetchUserList();\n  });\n}",
            "params": [
                "pagination"
            ]
        },
        "handleAdd": {
            "type": "JSFunction",
            "value": "function() {\n  console.log('Add user');\n}",
            "params": []
        },
        "handleEdit": {
            "type": "JSFunction",
            "value": "function(record) {\n  console.log('Edit user:', record);\n}",
            "params": [
                "record"
            ]
        },
        "handleDelete": {
            "type": "JSFunction",
            "value": "function(record) {\n  console.log('Delete user:', record);\n}",
            "params": [
                "record"
            ]
        }
    },
    "hidden": false,
    "title": "用户管理",
    "isLocked": false,
    "condition": true,
    "conditionGroup": "",
    "children": [
        {
            "componentName": "Card",
            "id": "card_1758713050748",
            "props": {
                "title": "用户查询",
                "style": {
                    "marginBottom": "20px"
                }
            },
            "children": [
                {
                    "componentName": "Form",
                    "id": "form_1758713050748",
                    "props": {
                        "onSubmit": {
                            "type": "JSFunction",
                            "value": "function(values) {\n  this.handleSearch(values);\n}"
                        },
                        "layout": "inline"
                    },
                    "children": [
                        {
                            "componentName": "Form.Item",
                            "id": "formItem_name",
                            "props": {
                                "label": "姓名",
                                "name": "name"
                            },
                            "children": [
                                {
                                    "componentName": "Input",
                                    "id": "input_name",
                                    "props": {
                                        "placeholder": "请输入姓名"
                                    }
                                }
                            ]
                        },
                        {
                            "componentName": "Form.Item",
                            "id": "formItem_email",
                            "props": {
                                "label": "邮箱",
                                "name": "email"
                            },
                            "children": [
                                {
                                    "componentName": "Input",
                                    "id": "input_email",
                                    "props": {
                                        "placeholder": "请输入邮箱"
                                    }
                                }
                            ]
                        },
                        {
                            "componentName": "Form.Item",
                            "id": "formItem_actions",
                            "children": [
                                {
                                    "componentName": "Button",
                                    "id": "button_search",
                                    "props": {
                                        "type": "primary",
                                        "htmlType": "submit",
                                        "children": "查询"
                                    }
                                },
                                {
                                    "componentName": "Button",
                                    "id": "button_reset",
                                    "props": {
                                        "style": {
                                            "marginLeft": "8px"
                                        },
                                        "children": "重置",
                                        "onClick": {
                                            "type": "JSFunction",
                                            "value": "function() {\n  this.handleSearch({});\n}"
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "componentName": "Card",
            "id": "card_1758713050749",
            "props": {
                "title": "用户列表",
                "extra": {
                    "componentName": "Button",
                    "id": "button_add",
                    "props": {
                        "type": "primary",
                        "children": "新增用户",
                        "onClick": {
                            "type": "JSFunction",
                            "value": "function() {\n  this.handleAdd();\n}"
                        }
                    }
                }
            },
            "children": [
                {
                    "componentName": "Table",
                    "id": "table_1758713050748",
                    "props": {
                        "rowKey": "id",
                        "dataSource": {
                            "type": "JSExpression",
                            "value": "[\n  {\n    id: '1',\n    name: '张三',\n    email: 'zhangsan@example.com',\n    age: 32,\n    address: '北京市朝阳区'\n  },\n  {\n    id: '2',\n    name: '李四',\n    email: 'lisi@example.com',\n    age: 28,\n    address: '上海市浦东新区'\n  },\n  {\n    id: '3',\n    name: '王五',\n    email: 'wangwu@example.com',\n    age: 35,\n    address: '广州市天河区'\n  }\n]"
                        },
                        "columns": [
                            {
                                "title": "姓名",
                                "dataIndex": "name",
                                "key": "name"
                            },
                            {
                                "title": "邮箱",
                                "dataIndex": "email",
                                "key": "email"
                            },
                            {
                                "title": "年龄",
                                "dataIndex": "age",
                                "key": "age"
                            },
                            {
                                "title": "地址",
                                "dataIndex": "address",
                                "key": "address"
                            },
                            {
                                "title": "操作",
                                "key": "action",
                                "render": {
                                    "type": "JSFunction",
                                    "value": "function(text, record) {\n  return (\n    <div>\n      <Button type=\"link\" onClick={() => this.handleEdit(record)}>编辑</Button>\n      <Button type=\"link\" danger onClick={() => this.handleDelete(record)}>删除</Button>\n    </div>\n  );\n}"
                                }
                            }
                        ],
                        "pagination": {
                            "type": "JSExpression",
                            "value": "{\n  ...this.state.pagination,\n  showSizeChanger: true,\n  onChange: (page, pageSize) => {\n    this.handleTableChange({\n      current: page,\n      pageSize\n    });\n  },\n  onShowSizeChange: (current, size) => {\n    this.handleTableChange({\n      current: 1,\n      pageSize: size\n    });\n  }\n}"
                        }
                    }
                }
            ]
        }
    ]
}