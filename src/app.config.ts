export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/mine/index',
    'pages/player/index',
    'pages/feedback/index',
    'pages/history/index'
  ],
  window: {
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: '#0f0f1a',
    navigationBarTitleText: '助眠白噪音',
    navigationBarTextStyle: 'white',
    backgroundColor: '#0f0f1a',
    backgroundImage: ''
  },
  tabBar: {
    color: '#6c6c80',
    selectedColor: '#4a6cf7',
    backgroundColor: '#1a1a2e',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
