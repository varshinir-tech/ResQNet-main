import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="not-found-container">
      <div class="not-found-box">
        <h1>404</h1>
        <h2>Resource or Incident Not Found</h2>
        <p>The page or disaster dispatch record you are searching for does not exist or has been relocated.</p>
        <a routerLink="/" class="btn btn-primary">Return to ResQ Mangaluru Home</a>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 60vh;
      text-align: center;
    }
    .not-found-box {
      background: white;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 3rem 2rem;
      max-width: 480px;
      box-shadow: var(--shadow-sm);
    }
    h1 {
      font-size: 3.5rem;
      font-weight: 800;
      color: var(--danger-color);
      line-height: 1;
    }
    h2 {
      font-size: 1.25rem;
      color: var(--primary-color);
      margin: 0.75rem 0;
    }
    p {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 1.5rem;
    }
  `]
})
export class NotFoundComponent {}
