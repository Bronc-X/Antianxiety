# Docker Desktop 连接问题解决

## ❌ 错误信息
```
ERROR: error during connect: Head "http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/_ping": open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
```

## 🔍 问题原因

这个错误表示 Docker Desktop 没有运行或没有完全启动。

## ✅ 解决方法

### 步骤 1: 检查 Docker Desktop 状态

1. **查看系统托盘**（右下角）
   - 找到 Docker 图标（鲸鱼图标）
   - 如果图标是灰色的或没有图标，说明 Docker 没有运行

2. **检查 Docker Desktop 是否在运行**
   - 按 `Ctrl + Shift + Esc` 打开任务管理器
   - 查看是否有 `Docker Desktop` 进程

### 步骤 2: 启动 Docker Desktop

1. **从开始菜单启动**
   - 点击 Windows 开始菜单
   - 搜索 "Docker Desktop"
   - 点击启动

2. **等待 Docker 完全启动**
   - Docker Desktop 启动需要一些时间（通常 30 秒到 2 分钟）
   - 等待系统托盘中的 Docker 图标变为绿色/正常状态
   - 图标上不应该有警告或错误标记

### 步骤 3: 验证 Docker 是否正常运行

在 Cursor 终端中执行：

```powershell
docker --version
```

**应该显示**：Docker 版本信息，如 `Docker version 24.0.0, build xxxxxx`

```powershell
docker ps
```

**应该显示**：容器列表（可能是空的，但不会报错）

### 步骤 4: 如果 Docker Desktop 无法启动

#### 方法 A: 重启 Docker Desktop

1. 右键点击系统托盘的 Docker 图标
2. 选择 **Quit Docker Desktop** 或 **退出**
3. 等待完全退出
4. 重新启动 Docker Desktop

#### 方法 B: 重启计算机

如果 Docker Desktop 一直无法启动，尝试重启计算机。

#### 方法 C: 检查 Docker Desktop 设置

1. 打开 Docker Desktop
2. 点击 **Settings**（设置）
3. 检查 **General**（常规）设置
4. 确保 **Use the WSL 2 based engine** 已启用（如果使用 WSL 2）

### 步骤 5: 重新运行构建脚本

Docker Desktop 启动成功后，再次运行：

```powershell
.\docker-build.ps1
```

## 🎯 快速检查清单

- [ ] Docker Desktop 正在运行（系统托盘图标正常）
- [ ] `docker --version` 命令可以执行
- [ ] `docker ps` 命令不报错
- [ ] Docker Desktop 完全启动（没有加载中的提示）

## ⚠️ 常见问题

### Q1: Docker Desktop 启动很慢

**正常情况**：
- 首次启动可能需要 1-2 分钟
- 后续启动通常 30 秒左右

**解决方法**：
- 等待 Docker Desktop 完全启动
- 检查系统资源使用情况

### Q2: Docker Desktop 启动失败

**可能原因**：
- 系统资源不足
- WSL 2 未正确安装
- 虚拟化未启用

**解决方法**：
1. 检查系统资源（内存、CPU）
2. 确认 WSL 2 已安装
3. 在 BIOS 中启用虚拟化

### Q3: 如何确认 Docker Desktop 已完全启动？

**标志**：
- 系统托盘图标变为正常状态（没有警告）
- `docker ps` 命令可以执行
- Docker Desktop 窗口显示 "Docker Desktop is running"

## 📝 完整操作流程

1. **检查 Docker Desktop 状态**
   - 查看系统托盘图标

2. **启动 Docker Desktop**（如果未运行）
   - 从开始菜单启动
   - 等待完全启动

3. **验证 Docker 运行**
   ```powershell
   docker --version
   docker ps
   ```

4. **重新运行构建脚本**
   ```powershell
   .\docker-build.ps1
   ```

## 🆘 如果还是不行

请告诉我：
1. Docker Desktop 是否已启动？
2. `docker --version` 命令的输出是什么？
3. `docker ps` 命令的输出是什么？

