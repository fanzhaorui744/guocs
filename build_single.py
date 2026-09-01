#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
单文件HTML打包脚本
将 css/style.css 和所有 js 文件内联到 index.html 中，
生成 single.html，评委收到一个文件双击即可打开。

用法：python build_single.py
"""
import os
import re
from pathlib import Path

BASE_DIR = Path(__file__).parent
INDEX_HTML = BASE_DIR / 'index.html'
OUTPUT_HTML = BASE_DIR / 'single.html'

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def build():
    html = read_file(INDEX_HTML)

    # 1. 内联 CSS
    css_link_pattern = r'<link rel="stylesheet" href="([^"]+)">'
    def replace_css(m):
        css_path = m.group(1)
        full_path = BASE_DIR / css_path
        if full_path.exists():
            css_content = read_file(full_path)
            return f'<style>\n{css_content}\n</style>'
        return m.group(0)
    html = re.sub(css_link_pattern, replace_css, html)

    # 2. 内联 JS（按顺序）
    js_pattern = r'<script src="([^"]+)"></script>'
    js_contents = []
    def collect_js(m):
        js_path = m.group(1)
        full_path = BASE_DIR / js_path
        if full_path.exists():
            js_contents.append(read_file(full_path))
        return ''
    html = re.sub(js_pattern, collect_js, html)

    # 在 </body> 前插入所有内联JS
    all_js = '\n'.join(js_contents)
    # 用特殊注释包裹，避免 </script> 问题
    all_js = all_js.replace('</script>', '<\\/script>')
    inline_script = f'<script>\n{all_js}\n</script>'
    html = html.replace('</body>', inline_script + '\n</body>')

    # 3. 移除 Lucide CDN 依赖提示（保留CDN引用，因为是外部库）
    # 在 head 中添加版本注释
    version_comment = '<!-- 单文件打包版本 2026-09-01 | 纯静态 | 本地流程原型 | 非医疗建议 -->'
    html = html.replace('<head>', '<head>\n' + version_comment)

    # 写入
    with open(OUTPUT_HTML, 'w', encoding='utf-8') as f:
        f.write(html)

    size_kb = os.path.getsize(OUTPUT_HTML) / 1024
    print(f'[完成] 单文件已生成：{OUTPUT_HTML}')
    print(f'[大小] {size_kb:.1f} KB')
    print(f'[说明] 评委双击 single.html 即可在浏览器中打开，无需服务器。')
    print(f'[注意] Lucide 图标库仍通过CDN加载，离线环境下图标显示为文字替代。')

if __name__ == '__main__':
    build()
