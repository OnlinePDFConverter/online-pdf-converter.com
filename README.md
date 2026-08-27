# Online PDF Converter

Online PDF Converter 是一个以浏览器端处理为主的在线 PDF 工具集合，提供 PDF 转换、编辑、整理、压缩、OCR、签名及多种文档与图片格式互转功能。

## 功能概览

- PDF 编辑与整理：合并、拆分、旋转、裁剪、删除/提取页面、添加页码与水印
- PDF 安全：加密保护、解锁、签名与修复
- PDF 转换：PDF 与 Word、Excel、PowerPoint、图片等格式互转
- 文档转 PDF：Word、Excel、PowerPoint、Markdown、RTF、ODT 等
- 图片转 PDF：JPG、PNG、WebP、TIFF、HEIC、PSD 等
- 电子书及其他格式：EPUB、MOBI、FB2、CBZ、DJVU、XPS 等
- 浏览器端能力：基于 Web Worker、WebAssembly、PDF.js、PyMuPDF、LibreOffice WASM 等组件处理文件
- 国际化：构建系统支持按语言生成页面与路由

## 技术栈

- JavaScript
- Webpack 5 / Webpack Dev Server
- Gulp
- PDF.js、pdf-lib、jsPDF
- Pyodide / PyMuPDF
- LibreOffice WebAssembly
- Tesseract.js

## 本地开发

### 环境要求

- Node.js（建议使用当前 LTS 版本）
- npm

### 安装依赖

```bash
npm install
```

首次运行时，从配置模板创建本地配置文件：

```bash
cp webpack.constants.dist.js webpack.constants.js
```

Windows PowerShell 可使用：

```powershell
Copy-Item webpack.constants.dist.js webpack.constants.js
```

### 启动开发服务器

```bash
npm run dev
```

默认开发配置使用 `localhost`，服务器端口及代理设置可在 `webpack.constants.js` 和 `webpack.dev.js` 中调整。

## 构建

生成生产构建：

```bash
npm run build
```

跳过静态资源构建：

```bash
npm run build:no-assets
```

生成 ZIP 发布包：

```bash
npm run build:zip
```

生成不含静态资源的 ZIP 发布包：

```bash
npm run build:zip:no-assets
```

构建产物写入 `build/`，ZIP 发布包写入 `build/zip/`；这些目录默认不会纳入 Git。

## 项目结构

```text
.
├── i18n/                  # 国际化文案
├── routers/               # 页面与开发服务器路由
├── src/
│   ├── assets/            # 字体、WASM、PDF.js 等静态资源
│   ├── common/            # 公共模块与 UI 基础代码
│   ├── components/        # 页面组件
│   ├── css/               # 样式
│   ├── entry/             # Webpack 页面入口
│   ├── libraries/         # PDF、文档及第三方集成封装
│   ├── pages/             # HTML 页面与布局
│   └── workers/           # 各类 PDF 工具的 Web Worker
├── tools/                 # 辅助脚本
├── gulpfile.mjs           # ZIP 打包流程
└── webpack.*.js           # Webpack 配置
```

## 配置说明

`webpack.constants.dist.js` 是配置模板。本地的 `webpack.constants.js` 包含域名、API 路径、第三方服务及开发服务器相关配置，并已通过 `.gitignore` 排除。部署前请按目标环境完成配置，避免将真实密钥或访问令牌提交到版本库。

## 许可证

本项目采用 [GNU Affero General Public License v3.0](LICENSE)（AGPL-3.0-only）许可。
