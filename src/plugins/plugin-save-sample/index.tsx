import { Button } from '@alifd/next';
import { IPublicModelPluginContext } from '@alilc/lowcode-types';
import AIAssistant from '../../components/AIAssistant';

// 保存功能示例
const SaveSamplePlugin = (ctx: IPublicModelPluginContext) => {
  return {
    async init() {
      const { skeleton, hotkey, config } = ctx;
      const scenarioName = config.get('scenarioName');

      skeleton.add({
        name: 'saveSample',
        area: 'topArea',
        type: 'Widget',
        props: {
          align: 'right',
        },
        content: <Button>保存到本地</Button>,
      });
      skeleton.add({
        name: 'resetSchema',
        area: 'topArea',
        type: 'Widget',
        props: {
          align: 'right',
        },
        content: <Button>重置页面</Button>,
      });
      skeleton.add({
        name: 'previewPage',
        area: 'topArea',
        type: 'Widget',
        props: {
          align: 'right',
        },
        content: (
          <Button 
            type="primary"
            onClick={() => {
               // 获取当前页面的schema数据
               const schema = ctx.project.exportSchema('Save' as any);
               // 将schema数据存储到localStorage或sessionStorage
               sessionStorage.setItem('previewSchema', JSON.stringify(schema));
               // 打开新窗口预览页面
               window.open('/preview', '_blank');
             }}
          >
            预览页面
          </Button>
        ),
      });
      skeleton.add({
        name: 'aiAssistant',
        area: 'topArea',
        type: 'Widget',
        props: {
          align: 'right',
        },
        content: <AIAssistant ctx={ctx} />,
      });
      hotkey.bind('command+s', (e) => {
        e.preventDefault();
      });
    },
  };
};
SaveSamplePlugin.pluginName = 'SaveSamplePlugin';

export default SaveSamplePlugin;
