import { Component, ElementRef, ViewChild, AfterViewChecked, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AiChatService } from '../../services/ai-chat.service';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './ai-chat.component.html',
  styleUrl: './ai-chat.component.css'
})
export class AiChatComponent implements AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef<HTMLDivElement>;

  public userInput: string = '';
  public expandedSources: Set<string> = new Set<string>();

  public get activeQuickSuggestions(): string[] {
    if (this.aiChatService.selectedSearchMode() === 'API') {
      return [
        '📦 Stock de Dolex',
        '📋 Medicamentos registrados',
        '⏳ Lotes y vencimientos',
        '📑 Resoluciones del sistema'
      ];
    } else {
      return [
        '📜 Normativa de medicamentos vencidos',
        '🛠️ ¿Cómo crear un nuevo producto?',
        '🗑️ ¿Cómo dar de baja un lote?',
        '📘 Manual de usuario de la app'
      ];
    }
  }

  public get inputPlaceholder(): string {
    return this.aiChatService.selectedSearchMode() === 'API'
      ? 'Consultar stock, productos, lotes, compras o clientes...'
      : 'Preguntar sobre normativas, resoluciones o manuales...';
  }

  private shouldScrollToBottom: boolean = false;

  constructor(public aiChatService: AiChatService) {
    // Escuchar cambios en los mensajes para auto-scroll
    effect(() => {
      const msgs = this.aiChatService.messages();
      if (msgs.length > 0) {
        this.shouldScrollToBottom = true;
      }
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  public setSearchMode(mode: 'DOCUMENTOS' | 'API'): void {
    this.aiChatService.setSearchMode(mode);
  }

  public selectModuleFilter(filterCode: string): void {
    this.aiChatService.setModuleFilter(filterCode);
  }

  public toggleSourceSnippet(sourceKey: string): void {
    if (this.expandedSources.has(sourceKey)) {
      this.expandedSources.delete(sourceKey);
    } else {
      this.expandedSources.add(sourceKey);
    }
  }

  public isSourceExpanded(sourceKey: string): boolean {
    return this.expandedSources.has(sourceKey);
  }

  public onSendMessage(): void {
    if (!this.userInput.trim()) return;
    const text = this.userInput;
    this.userInput = '';
    this.aiChatService.sendMessage(text);
  }

  public onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSendMessage();
    }
  }

  public sendQuickSuggestion(suggestionText: string): void {
    this.aiChatService.sendMessage(suggestionText);
  }

  public toggleChat(): void {
    this.aiChatService.toggleChat();
    if (this.aiChatService.isOpen()) {
      this.shouldScrollToBottom = true;
    }
  }

  public clearChat(): void {
    this.aiChatService.clearSessionChat();
    this.expandedSources.clear();
    this.shouldScrollToBottom = true;
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer && this.scrollContainer.nativeElement) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.warn('Scroll to bottom error:', err);
    }
  }
}

