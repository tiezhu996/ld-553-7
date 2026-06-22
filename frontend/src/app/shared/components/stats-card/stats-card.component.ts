import { Component, Input } from '@angular/core';

@Component({ standalone: false,
  selector: 'app-stats-card',
  template: `<section class="stats" [style.borderColor]="accent"><p>{{ title }}</p><strong [style.color]="accent">{{ value }}</strong><small [style.color]="accent">{{ trend }}</small></section>`,
  styles: [`.stats{border:1px solid #d8e0d6;background:#fbfcf8;border-radius:8px;padding:18px;transition:all .2s}.stats:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.08)}.stats p{margin:0 0 14px;color:#5f6f67;font-weight:700}.stats strong{font-size:30px;line-height:1}.stats small{display:block;margin-top:10px;color:#0e7c59}`]
})
export class StatsCardComponent {
  @Input() title = '';
  @Input() value: string | number = '';
  @Input() trend = '实时';
  @Input() accent?: string;
}
