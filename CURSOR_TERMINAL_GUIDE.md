# 在 Cursor 终端中操作指南

## ✅ 是的，完全可以在 Cursor 终端中操作！

Cursor 的终端就是 PowerShell，可以直接执行所有命令。

## 🚀 操作步骤

### 步骤 1: 打开 Cursor 终端

在 Cursor 中：
- 按 `` Ctrl + ` ``（反引号键，在数字 1 左边）
- 或点击菜单：**Terminal** → **New Terminal**
- 或使用快捷键：`Ctrl + Shift + ``

### 步骤 2: 确认当前目录

终端打开后，应该已经在项目目录了。确认一下：

```powershell
# 查看当前目录
pwd

# 应该显示类似：C:\Users\38939\Desktop\project-metabasis

# 查看文件列表，确认有 package.json、Dockerfile 等
ls
```

如果不在项目目录，执行：
```powershell
cd C:\Users\38939\Desktop\project-metabasis
```

### 步骤 3: 登录阿里云 ACR

```powershell
docker login registry.cn-guangzhou.aliyuncs.com
```

**输入：**
- Username: 你的阿里云账号
- Password: 你的 ACR 登录密码

**成功提示**：`Login Succeeded`

### 步骤 4: 运行构建脚本

```powershell
.\docker-build.ps1
```

**如果提示权限错误**：
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

然后再运行：
```powershell
.\docker-build.ps1
```

### 步骤 5: 等待构建完成

构建过程可能需要 5-10 分钟，你会看到：
- 下载基础镜像
- 安装依赖
- 构建应用
- 推送镜像

**成功标志**：
```
✅ 构建成功！
✅ 推送成功！
📦 镜像地址: registry.cn-guangzhou.aliyuncs.com/nomoreanxious/nomoreanxious:latest
```

## 💡 Cursor 终端的优势

1. **集成在编辑器中**：不需要切换窗口
2. **可以直接看到文件**：方便检查配置
3. **错误信息清晰**：可以直接看到输出
4. **支持多终端**：可以打开多个终端标签

## 🎯 完整操作流程（在 Cursor 中）

```powershell
# 1. 确认目录（应该已经在项目目录）
pwd

# 2. 登录 ACR
docker login registry.cn-guangzhou.aliyuncs.com

# 3. 运行构建脚本
.\docker-build.ps1

# 4. 等待完成...
```

## ⚠️ 注意事项

1. **确保 Docker Desktop 正在运行**
   - 检查系统托盘是否有 Docker 图标
   - 如果没有，启动 Docker Desktop

2. **如果 Docker 命令不识别**
   - 可能需要重启 Cursor
   - 或检查 Docker Desktop 是否正常运行

3. **网络连接**
   - 确保网络稳定
   - 构建和推送需要良好的网络连接

## 🐛 常见问题

### Q: 终端显示 "docker: command not found"

**解决方法**：
1. 确保 Docker Desktop 正在运行
2. 重启 Cursor
3. 或在系统 PowerShell 中测试 `docker --version`

### Q: 脚本执行权限错误

**解决方法**：
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Q: 如何查看构建进度？

构建过程中会显示详细输出，包括：
- 下载进度
- 构建步骤
- 推送进度

## ✅ 完成后的下一步

镜像推送成功后：
1. 记录镜像地址
2. 在 SAE 控制台创建应用
3. 使用镜像地址配置应用

---

**现在就可以在 Cursor 终端中开始操作了！**

