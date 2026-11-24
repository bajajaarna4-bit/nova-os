// nova-ai-assistant.ts — AI Assistant app
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { novaApi } from '../services/nova-api.js';

@customElement('nova-ai-assistant')
export class NovaAiAssistant extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--nova-bg-surface);
      color: var(--nova-text-primary);
      font-family: var(--nova-font-ui);
      padding: 16px;
      box-sizing: border-box;
    }
    .chat-log {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding-bottom: 12px;
    }
    .msg {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: var(--nova-radius-md);
      font-size: 13px;
      line-height: 1.4;
    }
    .msg.user {
      align-self: flex-end;
      background: var(--nova-accent-violet);
      color: #fff;
    }
    .msg.assistant {
      align-self: flex-start;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--nova-border);
    }
    .input-box {
      display: flex;
      gap: 8px;
      border-top: 1px solid var(--nova-border);
      padding-top: 12px;
    }
    input {
      flex: 1;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--nova-border);
      border-radius: var(--nova-radius-sm);
      padding: 8px 12px;
      color: #fff;
      font-family: inherit;
      outline: none;
    }
    button {
      padding: 8px 16px;
      background: var(--nova-accent-gradient);
      border: none;
      border-radius: var(--nova-radius-sm);
      color: #fff;
      font-weight: 600;
      cursor: pointer;
    }
  `;

  @state() private messages: Array<{ sender: string; text: string }> = [
    { sender: 'assistant', text: 'Hello! I am NOVA Intelligence. All operations respect your zero-trust permission policies.' }
  ];
  @state() private inputPrompt = '';

  private async sendPrompt() {
    const text = this.inputPrompt.trim();
    if (!text) return;

    this.messages.push({ sender: 'user', text });
    this.inputPrompt = '';
    this.requestUpdate();

    const response = await novaApi.queryAI(text);
    this.messages.push({ sender: 'assistant', text: response });
    this.requestUpdate();
  }

  render() {
    return html`
      <div class="chat-log">
        ${this.messages.map(m => html`
          <div class="msg ${m.sender}">${m.text}</div>
        `)}
      </div>
      <div class="input-box">
        <input
          type="text"
          placeholder="Ask NOVA Intelligence..."
          .value=${this.inputPrompt}
          @input=${(e: any) => { this.inputPrompt = e.target.value; }}
          @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this.sendPrompt(); }}
        />
        <button @click=${this.sendPrompt}>Send</button>
      </div>
    `;
  }
}
