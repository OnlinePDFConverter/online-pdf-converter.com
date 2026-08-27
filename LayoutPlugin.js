const HtmlWebpackPlugin = require("html-webpack-plugin");
class LayoutPlugin {
    apply(compiler) {
        compiler.hooks.compilation.tap('LayoutPlugin', (compilation) => {
            console.log('The compiler is starting a new compilation...')
            HtmlWebpackPlugin.getHooks(compilation).afterTemplateExecution.tapAsync(
                'LayoutPlugin',
                (data, cb) => {
                    // let pattern = /<!--content-->(.+)<!--content end-->/is;
                    // let pattern = /<!--{{content}}-->(.+)/is;
                    // let content = data.html.match(pattern);
                    // if (content && content[1]) {
                    //     data.html = data.html.replace(pattern, '').replace('{{content}}', content[1].trim());
                    // } else {
                    //     data.html = data.html.replace(pattern, '').replace('{{content}}', '');
                    // }

                    let pattern = /<!--({{.+?}})-->(.+?)<!--{{.+?}} end-->|<!--({{.+?}})-->(.+)/isg;
                    let content = [...data.html.matchAll(pattern)];
                    content.forEach(item => {
                        if (item[3]) {
                            data.html = data.html.replace(item[0], '').replace(item[3], item[4].trim());
                        } else {
                            data.html = data.html.replace(item[0], '').replace(item[1], item[2].trim());
                        }
                    });
                    data.html = data.html.replace(/{{.+?}}/g, '');
                    //删除空白行
                    data.html = data.html.replace(/^\s+[\r\n]/gm, '');
                    cb(null, data);
                }
            )
        })
    }
}

module.exports = LayoutPlugin;