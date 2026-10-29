import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Donation } from '../../models';

@Component({
  selector: 'app-donations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="donations-container">
      <div class="page-top">
        <div>
          <h2>🎁 Relief Donations & Supplies Tracking</h2>
          <p>Mangaluru flood and landslide monetary and material support records.</p>
        </div>
        <button class="btn btn-primary" (click)="showDonateModal = true">+ Record Donation</button>
      </div>

      <!-- Critical Evaluation Disclaimer -->
      <div class="disclaimer-alert">
        <span class="badge badge-demo">ACADEMIC SIMULATION NOTICE</span>
        <span>
          Payment transactions are simulated demo records. No real financial credentials or payment cards are stored or charged.
        </span>
      </div>

      <!-- Financial & Material Highlights -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon">💰</div>
          <div class="metric-info">
            <span class="val">₹{{ totalMonetary | number }}</span>
            <span class="lbl">Recorded Monetary Relief Funds</span>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon">📦</div>
          <div class="metric-info">
            <span class="val">{{ totalSuppliesCount }} Shipments</span>
            <span class="lbl">Recorded Material & Ration Batches</span>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon">📋</div>
          <div class="metric-info">
            <span class="val">{{ donations.length }} Total Records</span>
            <span class="lbl">Donations Documented in MongoDB</span>
          </div>
        </div>
      </div>

      <!-- Donations Table -->
      <div class="table-card">
        <div class="table-header">
          <h3>Donation Ledger</h3>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Donor</th>
              <th>Type</th>
              <th>Amount / Supplies Details</th>
              <th>Purpose / Region</th>
              <th>Date</th>
              <th>Status</th>
              @if (auth.isAdmin()) {
                <th>Admin Actions</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (d of donations; track d._id) {
              <tr>
                <td>
                  <strong>{{ d.isAnonymous ? 'Anonymous Donor' : d.donorName }}</strong>
                  @if (d.isDemoData) {
                    <span class="badge badge-demo badge-mini">Demo</span>
                  }
                </td>
                <td>
                  <span class="badge badge-low">{{ d.donationType }}</span>
                </td>
                <td>
                  @if (d.donationType === 'Monetary') {
                    <span class="amount-val">₹{{ d.amount | number }}</span>
                  } @else {
                    <span class="items-desc">{{ d.itemsDescription }}</span>
                  }
                </td>
                <td>{{ d.purpose }}</td>
                <td>{{ d.donationDate | date:'mediumDate' }}</td>
                <td>
                  <span class="badge" [ngClass]="d.status === 'Received' || d.status === 'Distributed' ? 'badge-resolved' : 'badge-reported'">
                    {{ d.status }}
                  </span>
                </td>
                @if (auth.isAdmin()) {
                  <td>
                    <button class="btn btn-danger btn-xs" (click)="deleteDonation(d._id)">Delete</button>
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Record Donation Modal -->
      @if (showDonateModal) {
        <div class="modal-backdrop">
          <div class="modal-box">
            <div class="modal-header">
              <h3>Record Demonstration Relief Donation</h3>
              <button class="close-btn" (click)="showDonateModal = false">✕</button>
            </div>
            <form (ngSubmit)="submitDonation()">
              <div class="form-group">
                <label class="form-label">Donation Type</label>
                <select [(ngModel)]="newDonation.donationType" name="type" class="form-control">
                  <option value="Monetary">Monetary Fund (₹ INR)</option>
                  <option value="Material / Relief Supplies">Material Supplies (Blankets, Tarpaulins)</option>
                  <option value="Food & Ration">Food Rations & Water</option>
                  <option value="Medical Kits">Medical Kits & First Aid</option>
                  <option value="Clothing">Clothing</option>
                </select>
              </div>

              @if (newDonation.donationType === 'Monetary') {
                <div class="form-group">
                  <label class="form-label">Simulated Amount (₹)</label>
                  <input type="number" [(ngModel)]="newDonation.amount" name="amount" class="form-control" required min="100" />
                </div>
              } @else {
                <div class="form-group">
                  <label class="form-label">Detailed Items & Quantities</label>
                  <textarea [(ngModel)]="newDonation.itemsDescription" name="items" class="form-control" placeholder="e.g. 50 Cartons mineral water, 100 blankets" required></textarea>
                </div>
              }

              <div class="form-group">
                <label class="form-label">Donor Name</label>
                <input type="text" [(ngModel)]="newDonation.donorName" name="donorName" class="form-control" [disabled]="newDonation.isAnonymous || false" />
              </div>

              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="newDonation.isAnonymous" name="anon" />
                  <span>Donate Anonymously</span>
                </label>
              </div>

              <div class="form-group">
                <label class="form-label">Target Relief Purpose</label>
                <input type="text" [(ngModel)]="newDonation.purpose" name="purpose" class="form-control" required />
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-outline" (click)="showDonateModal = false">Cancel</button>
                <button type="submit" class="btn btn-primary">Record Donation</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .donations-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .page-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .page-top h2 {
      font-size: 1.4rem;
      color: var(--primary-color);
      font-weight: 700;
    }
    .page-top p {
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .disclaimer-alert {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.8rem;
      color: #1e40af;
      margin-bottom: 1.5rem;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .metric-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: var(--shadow-sm);
    }
    .metric-icon {
      font-size: 2.2rem;
      background: #f1f5f9;
      width: 54px;
      height: 54px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .metric-info .val {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--primary-color);
      display: block;
      line-height: 1.1;
    }
    .metric-info .lbl {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.2rem;
      display: block;
    }
    .table-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      overflow-x: auto;
      box-shadow: var(--shadow-sm);
    }
    .table-header {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border-color);
    }
    .table-header h3 {
      font-size: 1rem;
      font-weight: 700;
      color: var(--primary-color);
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
      text-align: left;
    }
    .data-table th {
      background: #f8fafc;
      padding: 0.85rem 1rem;
      font-weight: 700;
      color: #475569;
      border-bottom: 1px solid var(--border-color);
    }
    .data-table td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid var(--border-color);
      vertical-align: middle;
    }
    .amount-val {
      font-weight: 700;
      color: #0d9488;
      font-size: 0.95rem;
    }
    .items-desc {
      font-size: 0.8rem;
      color: #334155;
    }
    .badge-mini {
      font-size: 0.6rem;
      margin-left: 0.25rem;
    }
    .btn-xs {
      padding: 0.2rem 0.5rem;
      font-size: 0.75rem;
    }
    /* Modal */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-box {
      background: white;
      width: 100%;
      max-width: 480px;
      border-radius: 10px;
      padding: 1.5rem;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
    }
    .close-btn {
      background: transparent;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: #334155;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1rem;
    }
  `]
})
export class DonationsComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  donations: Donation[] = [];
  totalMonetary = 0;
  totalSuppliesCount = 0;

  showDonateModal = false;
  newDonation: Partial<Donation> = {
    donorName: 'Community Benefactor',
    isAnonymous: false,
    donationType: 'Monetary',
    amount: 5000,
    itemsDescription: '',
    purpose: 'Mangaluru Monsoon Flood Relief'
  };

  ngOnInit(): void {
    this.loadDonations();
  }

  loadDonations(): void {
    this.api.getDonations().subscribe({
      next: (res) => {
        if (res.success) {
          this.donations = res.data;
          this.totalMonetary = res.totals.totalMonetary;
          this.totalSuppliesCount = res.totals.totalSuppliesCount;
          this.cdr.markForCheck();
        }
      }
    });
  }

  submitDonation(): void {
    this.api.createDonation(this.newDonation).subscribe({
      next: () => {
        this.showDonateModal = false;
        this.loadDonations();
      }
    });
  }

  deleteDonation(id: string): void {
    if (confirm('Delete this donation record?')) {
      this.api.deleteDonation(id).subscribe({
        next: () => this.loadDonations()
      });
    }
  }
}
