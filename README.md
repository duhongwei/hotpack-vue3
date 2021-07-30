# hotpack-vue3
[hotpack](https://github.com/duhongwei/hotpack) vue3 plugin
## install
environment  node >=14

`@uhongwei/hotpack-vue3` ,vue@next, vuex@next vue-router@next @vue/server-renderer should be installed at the same time

Don't worry about increasing the size of the release package. If you don't use the relevant modules, they won't be packaged in the package.

```bash
npm install vue@next vuex@next vue-router@next @vue/server-renderer @uhongwei/hotpack-vue3
```
## template 
clone the template project to experience all the features

```bash
git clone https://github.com/duhongwei/hotpack-tpl-vue3.git  my-app
cd my-app
npm install
npm start
```
## Precompiled

For multi-page applications, pre-compilation is a low-cost way to improve performance. To enable pre-compilation, you only need to declare it with the string `pre-ssr` in the template

```html
<div id='app' pre-ssr>
```
## Server-side rendering (isomorphic)

To enable server-side rendering, you only need to declare it with the string `ssr` in the template

```html
<div id='app' ssr>
```

Server-side rendering requires server-side support

Related configuration
```js
render:{
  enable: true,
  src:'./render',
  dist:'_render_'
}
```
src tell hotpack where to read the server file. After reading, the file in src/render will be copied directly to dist/_render_ after processed.


>node: The version information of vue and vue-render in the plugin should be consistent with the version information of vue and vue-render in ./render/package.json

## server render

after clone hotpack-tpl-vue3,stop the dev server,start building
ensure you are at the root path of hotpack-tpl-vue3

```shell
npm build
cd dist
npm install
node index.js
```

the output `hotpack.info server run at 3000` 

localhost:3000 view source file，it has been rendered on the server side.

After the development is completed, just upload the contents of the dist directory to the online server. Note that directories such as node_modules are excluded.

Of course, other configurations are needed, which will not be discussed here.