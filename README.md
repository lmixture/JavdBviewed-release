# JavdBviewed 发布中心

此仓库是 JavdBviewed 各产品的公开发布元数据中心。它托管版本清单、可复用的发布说明和发布校验，不托管 Cloud 容器镜像或用户数据。

## 当前产品

- Cloud：GHCR 容器镜像与 stable 更新清单。
- 后续客户端：沿用 `manifests/<product>/<channel>.json` 的目录结构，各产品独立维护版本和发布说明。

Cloud 首次部署可直接使用 [Compose 模板](./compose/cloud/compose.yaml) 与 [环境变量示例](./compose/cloud/.env.example)；模板默认拉取 `:latest` 正式镜像。

## Cloud 更新清单

Cloud stable 清单的权威地址为：

`https://raw.githubusercontent.com/JavdBviewed/JavdBviewed-release/main/manifests/cloud/stable.json`

Cloud 内置这个地址。自部署者无需配置主地址、检查开关或更新通道；网络需要加速时，仅可通过 `CLOUD_UPDATE_MANIFEST_MIRRORS` 提供完整的等价清单 URL 列表。

清单顶层的 `releaseStatus` 表示该版本是否已经开放部署：

- `preparing`：版本信息正在准备，镜像或发布说明可能尚未开放。
- `released`：版本已经正式发布，可以按清单中的镜像 tag 部署或升级。

候选版本进入清单时先保持 `preparing`。镜像、摘要和发布说明全部验收完成后，再把状态改为 `released`。

## 发布顺序

1. 从干净的 Cloud Git 提交构建并推送带版本号的 GHCR 镜像。
2. 获取 registry 返回的 image digest。
3. 更新 Cloud manifest 的提交、构建号、发布日期、镜像 tag 和 digest。
4. 执行 `node scripts/validate-manifests.mjs`。
5. 创建对应的 GitHub Release，并把清单的 `releaseStatus` 改为 `released`。
6. 再次执行清单校验并提交此仓库。

不要先发布指向不存在镜像的 stable manifest，也不要把加速域名、私有地址、token 或用户配置写入清单。
