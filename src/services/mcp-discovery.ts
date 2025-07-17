import { promises as fs } from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import type { MCPServerConfig } from '../types/mcp'

export interface DiscoveredServer {
  id: string
  name: string
  description: string
  command: string
  args: string[]
  connectionType: 'stdio' | 'sse' | 'https'
  source: 'pypi' | 'npm' | 'github' | 'local' | 'config'
  version?: string
  url?: string
  env?: Record<string, string>
  requirements?: string[]
  tags?: string[]
}

export interface DiscoveryResult {
  servers: DiscoveredServer[]
  errors: string[]
}

export class MCPDiscoveryService {
  private cache = new Map<string, DiscoveredServer[]>()
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes

  async discoverServers(): Promise<DiscoveryResult> {
    const allServers: DiscoveredServer[] = []
    const errors: string[] = []

    try {
      // Run all discovery methods in parallel
      const [pypiServers, npmServers, githubServers, localServers, configServers] = await Promise.allSettled([
        this.discoverPyPiServers(),
        this.discoverNpmServers(),
        this.discoverGithubServers(),
        this.discoverLocalServers(),
        this.discoverConfigServers()
      ])

      // Collect results and errors
      if (pypiServers.status === 'fulfilled') {
        allServers.push(...pypiServers.value)
      } else {
        errors.push(`PyPI discovery failed: ${pypiServers.reason}`)
      }

      if (npmServers.status === 'fulfilled') {
        allServers.push(...npmServers.value)
      } else {
        errors.push(`NPM discovery failed: ${npmServers.reason}`)
      }

      if (githubServers.status === 'fulfilled') {
        allServers.push(...githubServers.value)
      } else {
        errors.push(`GitHub discovery failed: ${githubServers.reason}`)
      }

      if (localServers.status === 'fulfilled') {
        allServers.push(...localServers.value)
      } else {
        errors.push(`Local discovery failed: ${localServers.reason}`)
      }

      if (configServers.status === 'fulfilled') {
        allServers.push(...configServers.value)
      } else {
        errors.push(`Config discovery failed: ${configServers.reason}`)
      }

      // Remove duplicates by ID
      const uniqueServers = allServers.filter((server, index, self) =>
        index === self.findIndex(s => s.id === server.id)
      )

      return {
        servers: uniqueServers,
        errors: errors.filter(Boolean)
      }
    } catch (error) {
      return {
        servers: [],
        errors: [`Discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }

  private async discoverPyPiServers(): Promise<DiscoveredServer[]> {
    const cacheKey = 'pypi-servers'
    const cached = this.getCached(cacheKey)
    if (cached) return cached

    try {
      // Check if uvx is available
      const uvxAvailable = await this.checkCommand('uvx', ['--version'])
      if (!uvxAvailable) {
        throw new Error('uvx not available')
      }

      const knownServers: DiscoveredServer[] = [
        {
          id: 'filesystem',
          name: 'Filesystem Server',
          description: 'Access and manipulate files and directories',
          command: 'uvx',
          args: ['mcp-server-filesystem'],
          connectionType: 'stdio',
          source: 'pypi',
          tags: ['filesystem', 'files', 'directories']
        },
        {
          id: 'git',
          name: 'Git Server',
          description: 'Git repository operations and version control',
          command: 'uvx',
          args: ['mcp-server-git'],
          connectionType: 'stdio',
          source: 'pypi',
          tags: ['git', 'version-control', 'repository']
        },
        {
          id: 'brave-search',
          name: 'Brave Search',
          description: 'Web search using Brave Search API',
          command: 'uvx',
          args: ['mcp-server-brave-search'],
          connectionType: 'stdio',
          source: 'pypi',
          env: {
            BRAVE_API_KEY: 'your-api-key-here'
          },
          requirements: ['BRAVE_API_KEY environment variable'],
          tags: ['search', 'web', 'api']
        },
        {
          id: 'sqlite',
          name: 'SQLite Server',
          description: 'SQLite database operations',
          command: 'uvx',
          args: ['mcp-server-sqlite', '--db-path', '/path/to/database.db'],
          connectionType: 'stdio',
          source: 'pypi',
          tags: ['database', 'sqlite', 'sql']
        },
        {
          id: 'postgres',
          name: 'PostgreSQL Server',
          description: 'PostgreSQL database operations',
          command: 'uvx',
          args: ['mcp-server-postgres'],
          connectionType: 'stdio',
          source: 'pypi',
          env: {
            POSTGRES_CONNECTION_STRING: 'postgresql://user:pass@localhost:5432/db'
          },
          requirements: ['PostgreSQL database connection'],
          tags: ['database', 'postgresql', 'sql']
        },
        {
          id: 'aws-docs',
          name: 'AWS Documentation',
          description: 'Search and browse AWS documentation',
          command: 'uvx',
          args: ['awslabs.aws-documentation-mcp-server@latest'],
          connectionType: 'stdio',
          source: 'pypi',
          env: {
            FASTMCP_LOG_LEVEL: 'ERROR'
          },
          tags: ['aws', 'documentation', 'cloud']
        },
        {
          id: 'memory',
          name: 'Memory Server',
          description: 'Persistent memory and knowledge management',
          command: 'uvx',
          args: ['mcp-server-memory'],
          connectionType: 'stdio',
          source: 'pypi',
          tags: ['memory', 'knowledge', 'persistence']
        },
        {
          id: 'puppeteer',
          name: 'Puppeteer Server',
          description: 'Web browser automation and scraping',
          command: 'uvx',
          args: ['mcp-server-puppeteer'],
          connectionType: 'stdio',
          source: 'pypi',
          tags: ['browser', 'automation', 'scraping']
        },
        {
          id: 'everart',
          name: 'EverArt Server',
          description: 'AI image generation and art tools',
          command: 'uvx',
          args: ['mcp-server-everart'],
          connectionType: 'stdio',
          source: 'pypi',
          env: {
            EVERART_API_KEY: 'your-api-key-here'
          },
          requirements: ['EverArt API key'],
          tags: ['ai', 'image', 'art', 'generation']
        },
        {
          id: 'sequential-thinking',
          name: 'Sequential Thinking',
          description: 'Structured thinking and reasoning tools',
          command: 'uvx',
          args: ['mcp-server-sequential-thinking'],
          connectionType: 'stdio',
          source: 'pypi',
          tags: ['thinking', 'reasoning', 'logic']
        }
      ]

      this.setCached(cacheKey, knownServers)
      return knownServers
    } catch (error) {
      console.warn('PyPI discovery failed:', error)
      return []
    }
  }

  private async discoverNpmServers(): Promise<DiscoveredServer[]> {
    const cacheKey = 'npm-servers'
    const cached = this.getCached(cacheKey)
    if (cached) return cached

    try {
      // Check if npm is available
      const npmAvailable = await this.checkCommand('npm', ['--version'])
      if (!npmAvailable) {
        throw new Error('npm not available')
      }

      const knownServers: DiscoveredServer[] = [
        {
          id: 'npm-filesystem',
          name: 'Node.js Filesystem Server',
          description: 'Filesystem operations using Node.js',
          command: 'npx',
          args: ['@modelcontextprotocol/server-filesystem'],
          connectionType: 'stdio',
          source: 'npm',
          tags: ['filesystem', 'nodejs', 'files']
        },
        {
          id: 'npm-fetch',
          name: 'Fetch Server',
          description: 'HTTP requests and web API interactions',
          command: 'npx',
          args: ['@modelcontextprotocol/server-fetch'],
          connectionType: 'stdio',
          source: 'npm',
          tags: ['http', 'fetch', 'api', 'web']
        },
        {
          id: 'npm-everything',
          name: 'Everything Server',
          description: 'Comprehensive MCP server with multiple tools',
          command: 'npx',
          args: ['@modelcontextprotocol/server-everything'],
          connectionType: 'stdio',
          source: 'npm',
          tags: ['comprehensive', 'multi-tool', 'everything']
        }
      ]

      this.setCached(cacheKey, knownServers)
      return knownServers
    } catch (error) {
      console.warn('NPM discovery failed:', error)
      return []
    }
  }

  private async discoverGithubServers(): Promise<DiscoveredServer[]> {
    const cacheKey = 'github-servers'
    const cached = this.getCached(cacheKey)
    if (cached) return cached

    try {
      // This would ideally search GitHub API for MCP servers
      // For now, we'll include some known GitHub-hosted servers
      const knownServers: DiscoveredServer[] = [
        {
          id: 'github-mcp-examples',
          name: 'MCP Examples',
          description: 'Example MCP servers from the official repository',
          command: 'git',
          args: ['clone', 'https://github.com/modelcontextprotocol/servers.git'],
          connectionType: 'stdio',
          source: 'github',
          tags: ['examples', 'reference', 'tutorial']
        }
      ]

      this.setCached(cacheKey, knownServers)
      return knownServers
    } catch (error) {
      console.warn('GitHub discovery failed:', error)
      return []
    }
  }

  private async discoverLocalServers(): Promise<DiscoveredServer[]> {
    const servers: DiscoveredServer[] = []

    try {
      // Check common local paths for MCP servers
      const commonPaths = [
        process.env.HOME + '/.local/bin',
        process.env.HOME + '/bin',
        '/usr/local/bin',
        '/opt/homebrew/bin'
      ]

      for (const dir of commonPaths) {
        try {
          const files = await fs.readdir(dir)
          const mcpFiles = files.filter(file => 
            file.includes('mcp-server') || file.includes('mcp_server')
          )

          for (const file of mcpFiles) {
            const fullPath = path.join(dir, file)
            const stat = await fs.stat(fullPath)
            
            if (stat.isFile()) {
              servers.push({
                id: `local-${file}`,
                name: file.replace(/mcp[-_]server[-_]?/, '').replace(/[-_]/g, ' ').trim() || file,
                description: `Local MCP server: ${file}`,
                command: fullPath,
                args: [],
                connectionType: 'stdio',
                source: 'local',
                tags: ['local', 'custom']
              })
            }
          }
        } catch (error) {
          // Ignore directory read errors
        }
      }

      return servers
    } catch (error) {
      console.warn('Local discovery failed:', error)
      return []
    }
  }

  private async discoverConfigServers(): Promise<DiscoveredServer[]> {
    const servers: DiscoveredServer[] = []

    try {
      // Check common config locations for MCP server definitions
      const configPaths = [
        process.env.HOME + '/.config/mcp/servers.json',
        process.env.HOME + '/.mcp/servers.json',
        process.cwd() + '/mcp-servers.json'
      ]

      for (const configPath of configPaths) {
        try {
          const content = await fs.readFile(configPath, 'utf8')
          const config = JSON.parse(content)

          if (config.servers && Array.isArray(config.servers)) {
            for (const server of config.servers) {
              servers.push({
                id: `config-${server.name || server.id}`,
                name: server.name || server.id,
                description: server.description || `Server from ${configPath}`,
                command: server.command,
                args: server.args || [],
                connectionType: server.connectionType || 'stdio',
                source: 'config',
                env: server.env,
                tags: ['config', 'external']
              })
            }
          }
        } catch (error) {
          // Ignore file read errors
        }
      }

      return servers
    } catch (error) {
      console.warn('Config discovery failed:', error)
      return []
    }
  }

  private async checkCommand(command: string, args: string[] = []): Promise<boolean> {
    return new Promise((resolve) => {
      const child = spawn(command, args, { stdio: 'pipe' })
      
      let resolved = false
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true
          child.kill()
          resolve(false)
        }
      }, 5000)

      child.on('error', () => {
        if (!resolved) {
          resolved = true
          clearTimeout(timeout)
          resolve(false)
        }
      })

      child.on('close', (code) => {
        if (!resolved) {
          resolved = true
          clearTimeout(timeout)
          resolve(code === 0)
        }
      })
    })
  }

  private getCached(key: string): DiscoveredServer[] | null {
    const cached = this.cache.get(key)
    if (cached) {
      return cached
    }
    return null
  }

  private setCached(key: string, servers: DiscoveredServer[]): void {
    this.cache.set(key, servers)
    
    // Clear cache after timeout
    setTimeout(() => {
      this.cache.delete(key)
    }, this.cacheTimeout)
  }

  async searchServers(query: string): Promise<DiscoveredServer[]> {
    const { servers } = await this.discoverServers()
    const lowercaseQuery = query.toLowerCase()

    return servers.filter(server => 
      server.name.toLowerCase().includes(lowercaseQuery) ||
      server.description.toLowerCase().includes(lowercaseQuery) ||
      server.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    )
  }

  async getServersByTag(tag: string): Promise<DiscoveredServer[]> {
    const { servers } = await this.discoverServers()
    return servers.filter(server => 
      server.tags?.includes(tag.toLowerCase())
    )
  }

  async installServer(server: DiscoveredServer): Promise<MCPServerConfig> {
    // Convert discovered server to MCP server config
    const config: MCPServerConfig = {
      id: server.id,
      name: server.name,
      command: server.command,
      args: server.args,
      connectionType: server.connectionType,
      disabled: false,
      autoApprove: [],
      env: server.env
    }

    // For uvx servers, we don't need to install anything
    // uvx handles installation automatically
    if (server.command === 'uvx') {
      return config
    }

    // For npm servers, install the package
    if (server.command === 'npx') {
      try {
        await this.runCommand('npm', ['install', '-g', server.args[0]])
      } catch (error) {
        console.warn('Failed to install npm package:', error)
      }
    }

    return config
  }

  private async runCommand(command: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { stdio: 'pipe' })
      
      child.on('error', (error) => {
        reject(error)
      })

      child.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Command failed with code ${code}`))
        }
      })
    })
  }
}