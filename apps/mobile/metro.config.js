const { getDefaultConfig } = require("expo/metro-config")
const path = require("path")

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, "../..")

const config = getDefaultConfig(projectRoot)

config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, "node_modules"),
    path.resolve(workspaceRoot, "node_modules"),
]
const mobileModules = path.resolve(projectRoot, "node_modules")

config.resolver.extraNodeModules = {
    react: path.resolve(mobileModules, "react"),
    "react-native": path.resolve(mobileModules, "react-native"),
    "expo-modules-core": path.resolve(mobileModules, "expo-modules-core"),
}

const singleReactModules = new Set(["react", "react/jsx-runtime", "react/jsx-dev-runtime"])

config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (singleReactModules.has(moduleName)) {
        return {
            type: "sourceFile",
            filePath: require.resolve(moduleName, { paths: [mobileModules] }),
        }
    }

    return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
