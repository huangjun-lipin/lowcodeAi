import React, { useState } from 'react';
import { Loading } from '@alifd/next';
import { buildComponents, assetBundle, AssetLevel, AssetLoader } from '@alilc/lowcode-utils';
import ReactRenderer from '@alilc/lowcode-react-renderer';
import { injectComponents } from '@alilc/lowcode-plugin-inject';
import { IPublicTypeProjectSchema } from '@alilc/lowcode-types';
import mergeWith from 'lodash/mergeWith';
import isArray from 'lodash/isArray';
import appHelper from './appHelper';
import assets from '../design/assets.json';
import './index.less';

const SamplePreview = () => {
  const [data, setData] = useState({});

  async function init() {
    // 从sessionStorage获取预览的schema数据
    const previewSchemaStr = sessionStorage.getItem('previewSchema');
    console.log('预览数据:', previewSchemaStr);
    
    if (!previewSchemaStr) {
      console.error('未找到预览数据');
      return;
    }

    const projectSchema: IPublicTypeProjectSchema = JSON.parse(previewSchemaStr);
    console.log('解析后的项目schema:', projectSchema);
    
    const { 
      componentsMap: componentsMapArray, 
      componentsTree,
      i18n,
      dataSource: projectDataSource,
    } = projectSchema;
    
    if (!componentsTree || componentsTree.length === 0) {
      console.error('预览数据格式错误');
      return;
    }

    const componentsMap: any = {};
    componentsMapArray.forEach((component: any) => {
      componentsMap[component.componentName] = component;
    });
    
    const pageSchema = componentsTree[0];
    console.log('组件树schema:', pageSchema);

    // 构建组件库映射
    const libraryMap: any = {};
    const libraryAsset: any[] = [];
    
    assets.packages.forEach(({ package: _package, library, urls }) => {
      if (library) {
        libraryMap[_package] = library;
      }
      if (urls) {
        libraryAsset.push(urls);
      }
    });

    console.log('组件库映射:', libraryMap);
    console.log('组件库资源:', libraryAsset);

    // 加载组件库资源
    const assetLoader = new AssetLoader();
    await assetLoader.load(libraryAsset);
    
    // 构建组件
    const components = await injectComponents(buildComponents(libraryMap, componentsMap, (schema) => {
      // 创建低代码组件的函数
      return class LowcodeComponent extends React.Component {
        render() {
          return React.createElement(ReactRenderer, {
            ...this.props,
            schema: schema.componentsTree[0],
            components: {},
            designMode: '',
          });
        }
      };
    }));
    console.log('构建的组件:', components);

    setData({
      schema: pageSchema,
      components,
      i18n: i18n || {},
      projectDataSource: projectDataSource || {},
    });
  }

  const { schema, components, i18n = {}, projectDataSource = {} } = data as any;

  if (!schema || !components) {
    init();
    return <Loading fullScreen />;
  }

  function customizer(objValue: [], srcValue: []) {
    if (isArray(objValue)) {
      return objValue.concat(srcValue || []);
    }
  }

  return (
    <div className="lowcode-plugin-sample-preview">
      <ReactRenderer
        className="lowcode-plugin-sample-preview-content"
        schema={{
          ...schema,
          dataSource: mergeWith(schema.dataSource, projectDataSource, customizer),
        }}
        components={components}
        locale="zh-CN"
        messages={i18n}
        appHelper={appHelper}
      />
    </div>
  );
};

export default SamplePreview;