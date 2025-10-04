// 公共头部组件
const HeaderComponent = {
  props: {
    currentPage: {
      type: String,
      required: true
    }
  },
  template: `
    <header class="gradient-bg text-white shadow-lg sticky top-0 z-50">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <span class="text-3xl">🚀</span>
            <div>
              <h1 class="text-xl font-bold">Spec Kit 需求配置器</h1>
              <p class="text-sm text-purple-100">项目需求可视化配置</p>
            </div>
          </div>
          <nav class="flex gap-3">
            <a 
              v-for="item in menuItems" 
              :key="item.page"
              :href="item.href" 
              :class="getNavClass(item.page)"
              class="px-4 py-2 rounded-lg transition-all text-sm font-semibold backdrop-blur"
            >
              {{ item.icon }} {{ item.label }}
            </a>
          </nav>
        </div>
      </div>
    </header>
  `,
  setup(props) {
    const menuItems = [
      { page: 'intro', href: '/intro.html', icon: '📖', label: 'Spec Kit 介绍' },
      { page: 'learn', href: '/learn.html', icon: '🎯', label: '指令详解' },
      { page: 'configure', href: '/configure.html', icon: '🚀', label: '需求配置' },
      { page: 'preview', href: '/preview.html', icon: '✨', label: '查看结果' }
    ];

    const getNavClass = (page) => {
      if (page === props.currentPage) {
        return 'bg-white text-purple-700 shadow-lg font-bold cursor-default';
      }
      return 'bg-white bg-opacity-20 hover:bg-opacity-30';
    };

    return {
      menuItems,
      getNavClass
    };
  }
};

