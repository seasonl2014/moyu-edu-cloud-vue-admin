module.exports = {

    chainWebpack: config => {
        config
            .plugin('html')
            .tap(args => {
                args[0].title = '欢迎使用后台管理平台'
                return args
            })
    }
}
