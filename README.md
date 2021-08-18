# Hotpack-vue3
[hotpack](https://github.com/duhongwei/hotpack) vue3 plugin
## Install
environment  node >=14

``` bash
npm install @duhongwei/hotpack-vue3
```

## examgle

clone the template project to experience all the features

```bash
git clone https://github.com/duhongwei/hotpack-tpl-vue3.git  my-app
cd my-app
npm install
```

[more detail](https://github.com/duhongwei/hotpack-tpl-vue3)

## Usage
@duhongwei/hotpack-vue3 provides references to vue, vue-router, vuex, supports pre-rendering and server-side rendering, no need to install these three modules separately

### Client Reference
```js
import Vue from 'vue'
import vueRouter from 'vue-router'
import Vuex from 'vuex'
```
These modules will be packaged into the final file only if you actually use them.

### Server Reference

```js
import {Vue,VueRouter,Vuex} from "@duhongwei/hotpack-vue3"
```

## Pre-rendering and server-side rendering

See [vue3 example](https://github.com/duhongwei/hotpack-tpl-vue3)
