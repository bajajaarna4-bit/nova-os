// nova-terminal.ts — Sandboxed developer terminal component
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('nova-terminal')
export class NovaTerminal extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #080910;
      color: #e0e2ec;
      font-family: var(--nova-font-mono, monospace);
      font-size: 13px;
      padding: 12px;
      box-sizing: border-box;
      overflow: hidden;
    }
    .history {
      flex: 1;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.5;
    }
    .line {
      margin-bottom: 4px;
    }
    .prompt {
      color: #7c5af0;
      font-weight: 600;
    }
    .input-row {
      display: flex;
      align-items: center;
      margin-top: 8px;
    }
    input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: #fff;
      font-family: inherit;
      font-size: inherit;
      margin-left: 8px;
    }
  `;

  @state() private history: Array<{ prompt: string; output: string }> = [
    { prompt: 'system', output: 'NOVA OS v0.1.0-alpha (x86_64-linux-gnu)\nType "help" for available commands.' }
  ];
  @state() private inputVal = '';

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      const cmd = this.inputVal.trim();
      let output = '';
      if (cmd === 'help') {
        output = 'Built-in commands:\n  help      Show this list\n  uname -a  Display kernel & OS information\n  status    Check system services\n  clear     Clear screen';
      } else if (cmd === 'uname -a') {
        output = 'Linux nova-system 6.11.0-nova-atomic #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux';
      } else if (cmd === 'status') {
        output = '● nova-core.service - active (running)\n● nova-permissions.service - active (running)\n● nova-ai-runtime.service - active (running)';
      } else if (cmd === 'clear') {
        this.history = [];
        this.inputVal = '';
        return;
      } else if (cmd.length > 0) {
        output = `nova-sh: command not found: ${cmd}`;
      }

      this.history.push({ prompt: 'user@nova:~$ ' + cmd, output });
      this.inputVal = '';
      this.requestUpdate();
    }
  }

  render() {
    return html`
      <div class="history">
        ${this.history.map(item => html`
          <div class="line"><span class="prompt">${item.prompt}</span></div>
          ${item.output ? html`<div class="line">${item.output}</div>` : ''}
        `)}
      </div>
      <div class="input-row">
        <span class="prompt">user@nova:~$</span>
        <input
          type="text"
          .value=${this.inputVal}
          @input=${(e: any) => { this.inputVal = e.target.value; }}
          @keydown=${this.handleKeyDown}
          autofocus
        />
      </div>
    `;
  }
}
