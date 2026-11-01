import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

/** Tela provisória das áreas que chegam nas próximas fases. */
@Component({
  selector: 'app-coming-soon',
  imports: [MatIconModule],
  template: `
    <div class="coming-soon">
      <mat-icon>construction</mat-icon>
      <h1>{{ title }}</h1>
      <p>Esta área está em construção e chega nas próximas versões do Portal CAS.</p>
    </div>
  `,
  styles: [`
    .coming-soon { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; padding: 64px 16px; color: #555b66; }
    .coming-soon mat-icon { width: 48px; height: 48px; font-size: 48px; color: #0067b1; }
    .coming-soon h1 { margin: 8px 0 0; font-size: 1.6rem; color: #15171c; }
    .coming-soon p { margin: 0; max-width: 420px; }
  `]
})
export class ComingSoonComponent {
  title = inject(ActivatedRoute).snapshot.data['title'] ?? 'Em breve';
}
