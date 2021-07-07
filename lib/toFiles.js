/**
 * 简单用正则分离 vue 单文件，不严谨，但够用了
 * 分离后会生成两个文件，a.vue => a.vue.js + a.vue.css, 
 * 可能会没有 css文件，但js 文件 一定会有
 */

import { basename } from 'path'
function split(content) {
  let html = {}, css = {}, js = {};
  content = content.replace(/<template>([^]+)<\/template>/, function (match, content) {
    html = {
      content
    }
    return ''
  })
  if (!html.content) {
    throw new Error('html can not be empty')
  }
  content = content.replace(/<style[^>]*?>([^]+)<\/style>/, function (match, content) {
    css = {
      content
    }
    return ''
  })

  content.replace(/<script[^>]*?>([^]+)<\/script>/, function (match, content) {

    js = {
      content
    }
    return ''
  })
  return {
    html,
    css,
    js
  }
}
export default function ({ path, content }) {

  let { html, js, css } = split(content)

  let result = []

  if (!js.content) {
    js = {
      content: `export default {\n  template:\`${html.content}\` \n}`,
    }
  }
  else {
    js.content = js.content.replace('export default {', `export default { template:\`${html.content}\`,`)
  }

  if (css.content) {
    js.content = `import './${basename(path)}.css'\n${js.content}`
  }
  js.content += '\n'
  js.path = `${path}.js`
  result.push(js)

  if (css.content) {
    css.path = `${path}.css`
    result.push(css)
  }
  return result
}