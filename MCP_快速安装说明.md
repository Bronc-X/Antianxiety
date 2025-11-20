# MCP Chart Server 快速安装说明

## 🚀 最简单的方法（推荐）

### 步骤 1: 找到配置文件位置

**方法 1：通过文件资源管理器（推荐，最简单）**

1. 按 `Win + R` 键（Win 键是键盘上的 Windows 徽标键）
2. 在弹出的"运行"对话框中输入：
   ```
   %APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings
   ```
3. 按回车，会自动打开这个文件夹
4. 如果文件夹不存在，就手动创建它

**方法 2：通过 Cursor 命令面板**

1. 在 Cursor 中按 `Ctrl + Shift + P`
2. 输入 `Preferences: Open User Settings (JSON)`
3. 这会打开一个 JSON 配置文件
4. 查看这个文件的路径，MCP 配置文件在同一个目录下

**说明**：`%APPDATA%` 是 Windows 的环境变量，实际路径通常是：
```
C:\Users\你的用户名\AppData\Roaming\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings
```

### 步骤 2: 创建或编辑配置文件

在该目录下创建或编辑文件：`cline_mcp_settings.json`

### 步骤 3: 复制配置内容

打开项目根目录的 `mcp-config-template.json` 文件，复制全部内容，粘贴到 `cline_mcp_settings.json` 中。

或者直接复制以下内容：

```json
{
  "mcpServers": {
    "mcp-server-chart": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@antv/mcp-server-chart"]
    }
  }
}
```

### 步骤 4: 保存并重启

1. 保存文件
2. **完全关闭 Cursor**（不是最小化）
3. 重新打开 Cursor
4. MCP 服务器会自动连接

## ✅ 验证安装

重启 Cursor 后，在对话中尝试：
- "帮我生成一个折线图，显示数据 [1,2,3,4,5]"

如果成功生成图表，说明安装成功！

## 💡 提示

- 首次使用时会自动下载 `@antv/mcp-server-chart` 包（通过 npx）
- 无需手动安装任何依赖
- 配置一次，永久使用

## 🔧 如果配置文件已存在

如果 `cline_mcp_settings.json` 已经存在，只需要在 `mcpServers` 对象中添加：

```json
"mcp-server-chart": {
  "command": "cmd",
  "args": ["/c", "npx", "-y", "@antv/mcp-server-chart"]
}
```

保持其他配置不变即可。

