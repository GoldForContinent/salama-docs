// payments.js
// Handles payment and reward modals, Supabase transaction logic, and status updates
import { supabase } from './supabase.js';

// Add this at the top of the file
let paymentTableInitialized = false;
// Helper to create a stylish modal
function createStylishModal({ title, content, actions, id = 'customPaymentModal' }) {
  document.getElementById(id)?.remove();
  const modal = document.createElement('div');
  modal.id = id;
  modal.style = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.45); z-index: 10000; display: flex; align-items: center; justify-content: center;`;
  const modalContent = document.createElement('div');
  modalContent.style = `
    background: #fff; border-radius: 18px; box-shadow: 0 8px 32px rgba(0,0,0,0.18);
    max-width: 420px; width: 95vw; padding: 0; overflow: hidden; position: relative; font-family: 'Poppins',sans-serif;`;
  // Kenyan flag bar
  modalContent.innerHTML = `
    <div style="height: 8px; width: 100%; background: linear-gradient(90deg,#006600 33%,#fff 33%,#fff 66%,#BB0000 66%,#BB0000 100%);"></div>
    <div style="padding: 32px 28px 18px 28px;">
      <h2 style="margin:0 0 18px 0;font-size:1.4em;color:#006600;font-weight:800;letter-spacing:0.5px;">${title}</h2>
      <div>${content}</div>
    </div>
  `;
  // Actions
  if (actions && actions.length) {
    const actionsDiv = document.createElement('div');
    actionsDiv.style = 'display:flex;gap:16px;justify-content:center;padding:0 0 28px 0;';
    actions.forEach(({ label, onClick, style }) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.style = style || 'padding: 12px 28px; border-radius: 8px; border: none; font-weight: 700; font-size: 1.08em; background: #10b981; color: #fff;';
      btn.onclick = onClick;
      actionsDiv.appendChild(btn);
    });
    modalContent.appendChild(actionsDiv);
  }
  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  closeBtn.style = 'position:absolute;top:10px;right:18px;background:none;border:none;font-size:2em;cursor:pointer;color:#BB0000;';
  closeBtn.onclick = () => modal.remove();
  modalContent.appendChild(closeBtn);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
}

// Inject internal CSS for payment modal label visibility
(function injectPaymentModalCSS() {
  if (!document.getElementById('payment-modal-style')) {
    const style = document.createElement('style');
    style.id = 'payment-modal-style';
    style.innerHTML = `
      .payment-modal-label input[type=\"radio\"] + span { color: #222 !important; }
      body.dark-mode .payment-modal-label input[type=\"radio\"] + span { color: #fff !important; }
    `;
    document.head.appendChild(style);
  }
})();

// Show the Pay to Reveal modal
window.showPaymentModal = async function(reportId, amount) {
  // Fetch the report for dynamic fee
  const { data: report } = await supabase.from('reports').select('*').eq('id', reportId).maybeSingle();
  const recoveryFee = report?.recovery_fee || amount || 200;
  let selectedProvider = 'mpesa';
  let phone = '';
  createStylishModal({
    title: 'Pay to Reveal',
    content: `
      <div style='text-align:center;'>
        <div style='font-size:2.2em;margin-bottom:10px;'><span style='color:#BB0000;font-weight:900;'>KSh ${recoveryFee}</span></div>
        <div style='margin-bottom:18px;font-size:1.08em;color:#222;'>Recovery Fee</div>
        <div style='margin-bottom:18px;'>
          <label style='font-weight:600;color:#006600;'>Payment Method:</label><br>
          <label class='payment-modal-label' style='margin-right:18px;'><input type='radio' name='provider' value='mpesa' checked> <span>M-Pesa (Safaricom)</span></label>
          <label class='payment-modal-label'><input type='radio' name='provider' value='airtel_money'> <span>Airtel Money</span></label>
        </div>
        <div style='margin-bottom:18px;'>
          <label style='font-weight:600;color:#006600;'>Phone Number:</label><br>
          <input id='payPhoneInput' type='tel' placeholder='07XXXXXXXX' style='padding:10px 14px;font-size:1.08em;border-radius:7px;border:1.5px solid #bbb;width:90%;margin-top:6px;'>
        </div>
      </div>
    `,
    actions: [
      {
        label: 'Pay',
        style: 'background:#BB0000;color:#fff;padding:12px 38px;border-radius:8px;font-weight:800;font-size:1.1em;letter-spacing:0.5px;',
        onClick: async () => {
          phone = document.getElementById('payPhoneInput').value.trim();
          selectedProvider = document.querySelector('input[name="provider"]:checked').value;
          if (!/^0[17]\d{8}$/.test(phone)) {
            alert('Please enter a valid Kenyan phone number.');
            return;
          }
          // Simulate payment
          const fakeCode = selectedProvider === 'mpesa' ? 'MPESA' : 'AIRTEL';
          const transactionCode = fakeCode + '-' + Math.floor(Math.random()*900000+100000);
          
          // Update the existing pending transaction instead of creating a new one
          await supabase.from('transactions')
            .update({
              provider: selectedProvider,
              phone_number: phone,
              transaction_code: transactionCode,
              status: 'completed'
            })
            .eq('report_id', reportId)
            .eq('transaction_type', 'recovery')
            .eq('status', 'pending');
          // Update recovered_reports status to completed
          await supabase.from('recovered_reports').update({ status: 'completed' }).or(`lost_report_id.eq.${reportId},found_report_id.eq.${reportId}`);
          // Update reports status as well
          await supabase.from('reports').update({ status: 'completed' }).eq('id', reportId);
          
          // Refresh UI components
          if (window.populateMyReportsSection) {
            window.populateMyReportsSection('recovered');
            window.populateMyReportsSection('completed');
          }
          if (window.updateRecoveredCount) await window.updateRecoveredCount();
          if (window.renderPaymentTable) await window.renderPaymentTable();
          createStylishModal({
            title: 'Payment Successful',
            content: `<div style='text-align:center;'><div style='font-size:2.5em;color:#10b981;margin-bottom:10px;'><i class='fas fa-check-circle'></i></div><div style='font-size:1.15em;font-weight:600;'>Your payment was received.<br>The collection point is now revealed!</div></div>`,
            actions: [
              { label: 'Close', style: 'background:#10b981;color:#fff;padding:10px 32px;border-radius:8px;font-weight:700;', onClick: () => document.getElementById('customPaymentModal')?.remove() }
            ]
          });
        }
      },
      { label: 'Cancel', style: 'background:#bbb;color:#222;padding:12px 38px;border-radius:8px;font-weight:700;font-size:1.1em;', onClick: () => document.getElementById('customPaymentModal')?.remove() }
    ]
  });
};

// Show the Claim Reward modal
window.showClaimRewardModal = async function(reportId, rewardAmount) {
  // Fetch the report for dynamic reward
  const { data: report } = await supabase.from('reports').select('*').eq('id', reportId).maybeSingle();
  const reward = report?.reward_amount || rewardAmount || 100;
  let selectedProvider = 'safaricom';
  let phone = '';
  createStylishModal({
    title: 'Claim Your Reward',
    content: `
      <div style='text-align:center;'>
        <div style='font-size:2.2em;margin-bottom:10px;'><span style='color:#10b981;font-weight:900;'>KSh ${reward}</span></div>
        <div style='margin-bottom:18px;font-size:1.08em;color:#222;'>Reward Amount</div>
        <div style='margin-bottom:18px;'>
          <label style='font-weight:600;color:#006600;'>Airtime Provider:</label><br>
          <label class='payment-modal-label' style='margin-right:18px;'><input type='radio' name='rewardProvider' value='safaricom' checked> <span>Safaricom</span></label>
          <label class='payment-modal-label' style='margin-right:18px;'><input type='radio' name='rewardProvider' value='airtel'> <span>Airtel</span></label>
          <label class='payment-modal-label'><input type='radio' name='rewardProvider' value='telkom'> <span>Telkom</span></label>
        </div>
        <div style='margin-bottom:18px;'>
          <label style='font-weight:600;color:#006600;'>Phone Number:</label><br>
          <input id='rewardPhoneInput' type='tel' placeholder='07XXXXXXXX' style='padding:10px 14px;font-size:1.08em;border-radius:7px;border:1.5px solid #bbb;width:90%;margin-top:6px;'>
        </div>
      </div>
    `,
    actions: [
      {
        label: 'Claim',
        style: 'background:linear-gradient(90deg,#10b981 60%,#ffd600 100%);color:#222;padding:12px 38px;border-radius:8px;font-weight:800;font-size:1.1em;letter-spacing:0.5px;',
        onClick: async () => {
          phone = document.getElementById('rewardPhoneInput').value.trim();
          selectedProvider = document.querySelector('input[name="rewardProvider"]:checked').value;
          if (!/^0[17]\d{8}$/.test(phone)) {
            alert('Please enter a valid Kenyan phone number.');
            return;
          }
          // Simulate reward payout
          const fakeCode = selectedProvider.toUpperCase() + '-' + Math.floor(Math.random()*900000+100000);
          
          // Update the existing pending transaction instead of creating a new one
          await supabase.from('transactions')
            .update({
              provider: selectedProvider,
              phone_number: phone,
              transaction_code: fakeCode,
              status: 'completed'
            })
            .eq('report_id', reportId)
            .eq('transaction_type', 'reward')
            .eq('status', 'pending');
          // Update recovered_reports status to completed
          await supabase.from('recovered_reports').update({ status: 'completed' }).or(`lost_report_id.eq.${reportId},found_report_id.eq.${reportId}`);
          // Update reports status as well
          await supabase.from('reports').update({ status: 'completed' }).eq('id', reportId);
          
          // Refresh UI components
          if (window.populateMyReportsSection) {
            window.populateMyReportsSection('recovered');
            window.populateMyReportsSection('completed');
          }
          if (window.updateRecoveredCount) await window.updateRecoveredCount();
          if (window.renderPaymentTable) await window.renderPaymentTable();
          createStylishModal({
            title: 'Reward Claimed!',
            content: `<div style='text-align:center;'><div style='font-size:2.5em;color:#10b981;margin-bottom:10px;'><i class='fas fa-gift'></i></div><div style='font-size:1.15em;font-weight:600;'>You will receive your airtime within 30 minutes.<br>Thank you for helping!</div></div>`,
            actions: [
              { label: 'Close', style: 'background:#10b981;color:#fff;padding:10px 32px;border-radius:8px;font-weight:700;', onClick: () => document.getElementById('customPaymentModal')?.remove() }
            ]
          });
        }
      },
      { label: 'Cancel', style: 'background:#bbb;color:#222;padding:12px 38px;border-radius:8px;font-weight:700;font-size:1.1em;', onClick: () => document.getElementById('customPaymentModal')?.remove() }
    ]
  });
};

// Render the Payment Management table for the current user
window.renderPaymentTable = async function() {
  try {
    const user = window.currentUser;
    if (!user) {
      console.log('No user logged in');
      return;
    }
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`*, report:report_id(id, report_type, status, report_documents(document_type, document_number))`)
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false });
    if (error) throw error;
    const tbody = document.querySelector('.payment-table tbody');
    if (!tbody) {
      console.log('Payment table body not found');
      return;
    }
    // Initialize only once
    if (!paymentTableInitialized) {
      setupPaymentTableFilters();
      paymentTableInitialized = true;
    }
    // Reset values to zero by default
    const totalTransacted = document.getElementById('totalTransacted');
    const pendingPayments = document.getElementById('pendingPayments');
    const pendingRewards = document.getElementById('pendingRewards');
    if (totalTransacted) totalTransacted.textContent = 'KES 0';
    if (pendingPayments) pendingPayments.textContent = '0';
    if (pendingRewards) pendingRewards.textContent = '0';
    tbody.innerHTML = '';
    if (!transactions || transactions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#888;padding:24px;">No payment or reward transactions found.</td></tr>`;
      return;
    }
    // Calculate summary values
    let total = 0, pendingPay = 0, pendingRew = 0;
    transactions.forEach(tx => {
      total += tx.amount || 0;
      if (tx.status === 'pending') {
        if (tx.transaction_type === 'recovery') pendingPay++;
        if (tx.transaction_type === 'reward') pendingRew++;
      }
    });
    if (totalTransacted) totalTransacted.textContent = 'KES ' + total;
    if (pendingPayments) pendingPayments.textContent = pendingPay;
    if (pendingRewards) pendingRewards.textContent = pendingRew;
    transactions.forEach(tx => {
      const doc = (tx.report && tx.report.report_documents && tx.report.report_documents[0]) || {};
      const docType = doc.document_type ? doc.document_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown';
      const docNumber = doc.document_number || 'N/A';
      const date = new Date(tx.timestamp).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      let actionBtn = '';
      if (tx.status === 'pending') {
        if (tx.transaction_type === 'recovery') {
          actionBtn = `<button class="action-btn btn-danger" onclick="showPaymentModal('${tx.report_id}', ${tx.amount})">Pay Now</button>`;
        } else if (tx.transaction_type === 'reward') {
          actionBtn = `<button class="action-btn btn-warning" onclick="showClaimRewardModal('${tx.report_id}', ${tx.amount})">Claim</button>`;
        }
      } else if (tx.status === 'completed') {
        actionBtn = `<button class="action-btn btn-success" onclick="alert('Receipt coming soon!')">View</button>`;
      }
      tbody.innerHTML += `
        <tr>
          <td>${date}</td>
          <td>${tx.transaction_type === 'recovery' ? 'Recovery' : 'Reward'}</td>
          <td>KSh ${tx.amount}</td>
          <td>${tx.provider ? tx.provider.charAt(0).toUpperCase() + tx.provider.slice(1) : '-'}</td>
          <td><span class="status-badge status-${tx.status}">${tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}</span></td>
          <td><a href="#" class="doc-link">${docType} (${docNumber})</a></td>
          <td>${actionBtn}</td>
        </tr>
      `;
    });
  } catch (error) {
    console.error('Error rendering payment table:', error);
  }
};

// Additional payment/reward logic will be added here as features are built. 

function setupPaymentTableFilters() {
  const typeFilter = document.querySelector('.payment-filter-select:nth-of-type(1)');
  const statusFilter = document.querySelector('.payment-filter-select:nth-of-type(2)');
  const searchInput = document.querySelector('.payment-search-input');
  if (typeFilter && statusFilter && searchInput) {
    typeFilter.addEventListener('change', window.renderPaymentTable);
    statusFilter.addEventListener('change', window.renderPaymentTable);
    searchInput.addEventListener('input', window.renderPaymentTable);
  }
} 