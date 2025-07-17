/**
 * Demo utility for testing iframe inspector with different frameworks
 * This helps validate the deep integration capabilities
 */

export interface DemoApp {
  name: string;
  framework: 'react' | 'vue' | 'angular' | 'svelte';
  url: string;
  description: string;
  testElements: {
    selector: string;
    expectedComponent?: string;
    description: string;
  }[];
}

export const DEMO_APPS: DemoApp[] = [
  {
    name: 'React Todo App',
    framework: 'react',
    url: 'http://localhost:3000',
    description: 'A simple React todo application with hooks and components',
    testElements: [
      {
        selector: '.todo-item',
        expectedComponent: 'TodoItem',
        description: 'Individual todo item component'
      },
      {
        selector: '.todo-list',
        expectedComponent: 'TodoList',
        description: 'Container for todo items'
      },
      {
        selector: '.add-todo-form',
        expectedComponent: 'AddTodoForm',
        description: 'Form for adding new todos'
      }
    ]
  },
  {
    name: 'Next.js App',
    framework: 'react',
    url: 'http://localhost:3000',
    description: 'Next.js application with SSR and routing',
    testElements: [
      {
        selector: '[data-testid="header"]',
        expectedComponent: 'Header',
        description: 'Navigation header component'
      },
      {
        selector: '.page-content',
        expectedComponent: 'PageLayout',
        description: 'Main page layout component'
      }
    ]
  },
  {
    name: 'Vue.js App',
    framework: 'vue',
    url: 'http://localhost:8080',
    description: 'Vue.js application with composition API',
    testElements: [
      {
        selector: '.vue-component',
        expectedComponent: 'VueComponent',
        description: 'Basic Vue component'
      }
    ]
  },
  {
    name: 'Vite React App',
    framework: 'react',
    url: 'http://localhost:5173',
    description: 'React app built with Vite',
    testElements: [
      {
        selector: '#root',
        expectedComponent: 'App',
        description: 'Root application component'
      }
    ]
  },
  {
    name: 'Angular App',
    framework: 'angular',
    url: 'http://localhost:4200',
    description: 'Angular application with components and services',
    testElements: [
      {
        selector: 'app-root',
        expectedComponent: 'AppComponent',
        description: 'Root Angular component'
      }
    ]
  }
];

export class InspectorTestRunner {
  private iframe: HTMLIFrameElement | null = null;

  constructor(iframe: HTMLIFrameElement) {
    this.iframe = iframe;
  }

  /**
   * Run automated tests on the current app
   */
  public async runTests(demoApp: DemoApp): Promise<TestResult[]> {
    if (!this.iframe?.contentWindow) {
      throw new Error('Iframe not available');
    }

    const results: TestResult[] = [];

    for (const testElement of demoApp.testElements) {
      try {
        const result = await this.testElement(testElement);
        results.push(result);
      } catch (error) {
        results.push({
          selector: testElement.selector,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          description: testElement.description
        });
      }
    }

    return results;
  }

  /**
   * Test a specific element
   */
  private async testElement(testElement: DemoApp['testElements'][0]): Promise<TestResult> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({
          selector: testElement.selector,
          success: false,
          error: 'Test timeout',
          description: testElement.description
        });
      }, 5000);

      // Inject test script
      const script = `
        (function() {
          const element = document.querySelector('${testElement.selector}');
          if (!element) {
            window.parent.postMessage({
              type: 'GROK_TEST_RESULT',
              selector: '${testElement.selector}',
              success: false,
              error: 'Element not found'
            }, '*');
            return;
          }

          // Simulate click to trigger inspection
          const rect = element.getBoundingClientRect();
          const clickEvent = new MouseEvent('click', {
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
            bubbles: true
          });
          
          element.dispatchEvent(clickEvent);
          
          // Give some time for inspection to process
          setTimeout(() => {
            window.parent.postMessage({
              type: 'GROK_TEST_RESULT',
              selector: '${testElement.selector}',
              success: true,
              componentFound: element.__reactInternalFiber || element._reactInternalFiber ? true : false
            }, '*');
          }, 100);
        })();
      `;

      // Listen for test result
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'GROK_TEST_RESULT' && event.data.selector === testElement.selector) {
          clearTimeout(timeout);
          window.removeEventListener('message', handleMessage);
          
          resolve({
            selector: testElement.selector,
            success: event.data.success,
            error: event.data.error,
            componentFound: event.data.componentFound,
            description: testElement.description,
            expectedComponent: testElement.expectedComponent
          });
        }
      };

      window.addEventListener('message', handleMessage);

      // Inject and run the test script
      try {
        const doc = this.iframe!.contentDocument;
        if (doc) {
          const scriptElement = doc.createElement('script');
          scriptElement.textContent = script;
          doc.head.appendChild(scriptElement);
        }
      } catch (e) {
        clearTimeout(timeout);
        window.removeEventListener('message', handleMessage);
        resolve({
          selector: testElement.selector,
          success: false,
          error: 'Could not inject test script',
          description: testElement.description
        });
      }
    });
  }

  /**
   * Generate test report
   */
  public generateReport(demoApp: DemoApp, results: TestResult[]): string {
    const passedTests = results.filter(r => r.success).length;
    const totalTests = results.length;
    const passRate = Math.round((passedTests / totalTests) * 100);

    let report = `# Iframe Inspector Test Report\\n\\n`;
    report += `**App:** ${demoApp.name} (${demoApp.framework})\\n`;
    report += `**URL:** ${demoApp.url}\\n`;
    report += `**Description:** ${demoApp.description}\\n\\n`;
    report += `**Results:** ${passedTests}/${totalTests} tests passed (${passRate}%)\\n\\n`;

    results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      report += `${index + 1}. ${status} **${result.selector}**\\n`;
      report += `   - ${result.description}\\n`;
      
      if (result.expectedComponent) {
        report += `   - Expected: ${result.expectedComponent}\\n`;
      }
      
      if (result.componentFound !== undefined) {
        report += `   - Component detected: ${result.componentFound ? 'Yes' : 'No'}\\n`;
      }
      
      if (result.error) {
        report += `   - Error: ${result.error}\\n`;
      }
      
      report += `\\n`;
    });

    return report;
  }
}

export interface TestResult {
  selector: string;
  success: boolean;
  error?: string;
  componentFound?: boolean;
  description: string;
  expectedComponent?: string;
}
