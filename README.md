# hotpack-vue3
hotpack plugin for vu3

环境要求 node >=14

vue3插件已经 把 `vue3`,`vuex@next` `vue-router@next` `@vue/server-renderer` 预安装了。

在项目中只要安装了vue3插件，上面模块就不用再安装了。
不用担心要增加发布包的大小，如果你没有用到相关的模块，是不会打包到包里的。

## 预编译

对于多页应用来说，预编译是成本低的提高性能的方式。要启用预编译，只需要在模板中用字符串 `pre-ssr` 声明即可

```html
<div id='app' pre-ssr>
```
## 服务端渲染（同构）
要启用服务端渲染，只需要在模板中用字符串 `ssr` 声明即可

```html
<div id='app' ssr>
```
刷新页面就看到预编译的结果了

## 服务端渲染
服务端渲染需要服务端支持，而且服务端的 vue render 版本必须和 vue 版本完全一致，所以vue3插件把版本信息放在 meta['vue3Dependences']

在项目的配置文件里加上如下信息
```js
render:{
  enable:true,
  versionKey:'vue3Dependences',
  src:'render'
}
```
src 是指示工具从哪里读服务端server的文件，读完后，会把src中的文件直接copy 到 dist
  一般会有如何文件
1. index.js，启动web服务
2. package.json  `versionKey`指定的依赖信息会和这里的依赖信息合并。有重复`versionKey`中的优先
3. https 用到的证书
4. 其它的文件

准备好之后
```shell
npm build
cd dist
npm install
node index.js
```

看到有输出 `hotpack.info server run at 3000`  说明服务器已经启动成功了。

输入localhost:3000 查看原文件，发现真的已经在服务端渲染好了。

用`hotpack` 做服务端渲染就是这么简单！

开发完成，只要把 dist 目录的内容上传正式服务器就可以了。注意排除node_modules这样的目录。
当然了还需要其它的配置，这个就不在这里讨论了。