/* Master System Reports View Controller — Ultra Compact Printable Student Activity Report (Divided into SE(ECE)-A and SE(ECE)-B) */
const ReportsView = {
  currentDivFilter: 'SE(ECE)-A',

  switchDivisionFilter(divName) {
    this.currentDivFilter = divName;
    const btnA = document.getElementById('btn-report-div-a');
    const btnB = document.getElementById('btn-report-div-b');
    const btnAll = document.getElementById('btn-report-div-all');

    if (btnA) btnA.className = (divName === 'SE(ECE)-A') ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm';
    if (btnB) btnB.className = (divName === 'SE(ECE)-B') ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm';
    if (btnAll) btnAll.className = (divName === 'ALL') ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm';

    const secA = document.getElementById('section-report-div-a');
    const secB = document.getElementById('section-report-div-b');

    if (secA) secA.style.display = (divName === 'ALL' || divName === 'SE(ECE)-A') ? 'block' : 'none';
    if (secB) secB.style.display = (divName === 'ALL' || divName === 'SE(ECE)-B') ? 'block' : 'none';
  },

  async render() {
    try {
      const data = await API.get('/api/reports');
      const reports = data.reports || [];
      const cumulativeStudents = data.cumulative_student_summary || [];

      // Sort and separate students strictly into Division A and Division B
      const divAStudents = cumulativeStudents
        .filter(s => s.division_name === 'SE(ECE)-A' || (s.division_id && s.division_id == 1))
        .sort((a, b) => (parseInt(a.roll_no) || 0) - (parseInt(b.roll_no) || 0));

      const divBStudents = cumulativeStudents
        .filter(s => s.division_name === 'SE(ECE)-B' || (s.division_id && s.division_id == 2))
        .sort((a, b) => (parseInt(a.roll_no) || 0) - (parseInt(b.roll_no) || 0));

      const renderTableRow = (s, idx) => {
        const ss_th = s.SS_TH !== undefined ? s.SS_TH : (s.SS || 0);
        const dsa_th = s.DSA_TH !== undefined ? s.DSA_TH : (s.DSA || 0);
        const sdc_th = s.SDC_TH !== undefined ? s.SDC_TH : (s.SDC || 0);
        const fds_th = s.FDS_TH !== undefined ? s.FDS_TH : (s.FDS || 0);
        const pme_th = s.PME_TH !== undefined ? s.PME_TH : (s.PME || 0);
        const oec_th = s.OEC_TH !== undefined ? s.OEC_TH : (s.OEC || 0);
        const vec_th = s.VEC_TH !== undefined ? s.VEC_TH : (s.VEC || 0);

        const total_th = s.total_theory !== undefined ? s.total_theory : (ss_th + dsa_th + sdc_th + fds_th + pme_th + oec_th + vec_th);

        const sdc_lab = s.SDC_LAB !== undefined ? s.SDC_LAB : 0;
        const dsa_lab = s.DSA_LAB !== undefined ? s.DSA_LAB : 0;
        const vsec_lab = s.VSEC_LAB !== undefined ? s.VSEC_LAB : (s.VSEC || 0);

        const total_lab = s.total_lab !== undefined ? s.total_lab : (sdc_lab + dsa_lab + vsec_lab);

        const combined = s.total_accumulated_activities !== undefined ? s.total_accumulated_activities : (total_th + total_lab);

        return `
          <tr>
            <td style="font-weight: 700; text-align: center; padding: 0.4rem; font-family: monospace; font-size: 0.95rem; color: var(--primary);">${s.roll_no || (idx + 1)}</td>
            <td style="padding: 0.4rem; min-width: 170px;">
              <strong style="font-size: 0.88rem; color: var(--text-main);">${s.student_name}</strong>
            </td>
            <td style="padding: 0.4rem;"><span style="font-family: monospace; font-size: 0.82rem; font-weight: 700; color: #475569;">PRN: ${s.prn_no || 'N/A'}</span></td>
            <td style="padding: 0.4rem; border-right: 2px solid #cbd5e1;"><span class="badge-role role-STUDENT" style="font-weight: 800; font-size: 0.75rem;">${s.division_name} (${s.batch_name})</span></td>
            
            <!-- Theory Section -->
            <td style="text-align: center; font-weight: 700; color: ${ss_th > 0 ? '#1e40af' : '#94a3b8'}; background: ${ss_th > 0 ? '#eff6ff' : 'transparent'};">${ss_th}</td>
            <td style="text-align: center; font-weight: 700; color: ${dsa_th > 0 ? '#1e40af' : '#94a3b8'}; background: ${dsa_th > 0 ? '#eff6ff' : 'transparent'};">${dsa_th}</td>
            <td style="text-align: center; font-weight: 700; color: ${sdc_th > 0 ? '#1e40af' : '#94a3b8'}; background: ${sdc_th > 0 ? '#eff6ff' : 'transparent'};">${sdc_th}</td>
            <td style="text-align: center; font-weight: 700; color: ${fds_th > 0 ? '#1e40af' : '#94a3b8'}; background: ${fds_th > 0 ? '#eff6ff' : 'transparent'};">${fds_th}</td>
            <td style="text-align: center; font-weight: 700; color: ${pme_th > 0 ? '#1e40af' : '#94a3b8'}; background: ${pme_th > 0 ? '#eff6ff' : 'transparent'};">${pme_th}</td>
            <td style="text-align: center; font-weight: 700; color: ${oec_th > 0 ? '#1e40af' : '#94a3b8'}; background: ${oec_th > 0 ? '#eff6ff' : 'transparent'};">${oec_th}</td>
            <td style="text-align: center; font-weight: 700; color: ${vec_th > 0 ? '#1e40af' : '#94a3b8'}; background: ${vec_th > 0 ? '#eff6ff' : 'transparent'}; border-right: 2px solid #cbd5e1;">${vec_th}</td>
            
            <!-- Practical / Lab Section -->
            <td style="text-align: center; font-weight: 700; color: ${sdc_lab > 0 ? '#b45309' : '#94a3b8'}; background: ${sdc_lab > 0 ? '#fffbeb' : 'transparent'};">${sdc_lab}</td>
            <td style="text-align: center; font-weight: 700; color: ${dsa_lab > 0 ? '#b45309' : '#94a3b8'}; background: ${dsa_lab > 0 ? '#fffbeb' : 'transparent'};">${dsa_lab}</td>
            <td style="text-align: center; font-weight: 700; color: ${vsec_lab > 0 ? '#b45309' : '#94a3b8'}; background: ${vsec_lab > 0 ? '#fffbeb' : 'transparent'}; border-right: 2px solid #cbd5e1;">${vsec_lab}</td>

            <!-- Totals & Combined Summary -->
            <td style="text-align: center; font-weight: 700; color: #1e293b; background: #f8fafc; min-width: 55px;">${total_th}</td>
            <td style="text-align: center; font-weight: 700; color: #1e293b; background: #f8fafc; border-right: 2px solid #cbd5e1; min-width: 55px;">${total_lab}</td>
            <td style="text-align: center; padding: 0.4rem; background: #dcfce7; min-width: 75px;"><strong style="color: #166534; font-size: 1rem;">${combined}</strong></td>
          </tr>
        `;
      };

      const divARows = divAStudents.map(renderTableRow).join('') || `<tr><td colspan="17" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No student records found in Division A.</td></tr>`;
      const divBRows = divBStudents.map(renderTableRow).join('') || `<tr><td colspan="17" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No student records found in Division B.</td></tr>`;

      // Certificate Logs Rows
      const certRows = reports.map(r => {
        const ss_th = r.SS_TH !== undefined ? r.SS_TH : (r.SS || 0);
        const dsa_th = r.DSA_TH !== undefined ? r.DSA_TH : (r.DSA || 0);
        const sdc_th = r.SDC_TH !== undefined ? r.SDC_TH : (r.SDC || 0);
        const fds_th = r.FDS_TH !== undefined ? r.FDS_TH : (r.FDS || 0);
        const pme_th = r.PME_TH !== undefined ? r.PME_TH : (r.PME || 0);
        const oec_th = r.OEC_TH !== undefined ? r.OEC_TH : (r.OEC || 0);
        const vec_th = r.VEC_TH !== undefined ? r.VEC_TH : (r.VEC || 0);
        const total_th = r.total_theory !== undefined ? r.total_theory : (ss_th + dsa_th + sdc_th + fds_th + pme_th + oec_th + vec_th);

        const sdc_lab = r.SDC_LAB !== undefined ? r.SDC_LAB : 0;
        const dsa_lab = r.DSA_LAB !== undefined ? r.DSA_LAB : 0;
        const vsec_lab = r.VSEC_LAB !== undefined ? r.VSEC_LAB : (r.VSEC || 0);
        const total_lab = r.total_lab !== undefined ? r.total_lab : (sdc_lab + dsa_lab + vsec_lab);

        const total_act = r.total_activities !== undefined ? r.total_activities : (total_th + total_lab);

        return `
          <tr>
            <td style="text-align: center; font-weight: 700;">${r.sr_no}</td>
            <td><strong>${r.student_name}</strong><br><span style="font-size: 0.75rem; color: var(--text-muted);">Roll: ${r.roll_no} | PRN: ${r.prn_no}</span></td>
            <td><span class="badge-role role-STUDENT">${r.division_name} (${r.batch_name})</span></td>
            <td><strong>${r.event_name}</strong><br><span style="font-size: 0.75rem; color: var(--primary);">${r.category}</span></td>
            <td>${r.certificate_date}</td>
            <td><span class="badge-status status-${r.status}">${r.status}</span></td>
            
            <!-- Theory Columns -->
            <td style="text-align: center; font-weight: 700; color: ${ss_th > 0 ? '#1e40af' : '#94a3b8'};">${ss_th}</td>
            <td style="text-align: center; font-weight: 700; color: ${dsa_th > 0 ? '#1e40af' : '#94a3b8'};">${dsa_th}</td>
            <td style="text-align: center; font-weight: 700; color: ${sdc_th > 0 ? '#1e40af' : '#94a3b8'};">${sdc_th}</td>
            <td style="text-align: center; font-weight: 700; color: ${fds_th > 0 ? '#1e40af' : '#94a3b8'};">${fds_th}</td>
            <td style="text-align: center; font-weight: 700; color: ${pme_th > 0 ? '#1e40af' : '#94a3b8'};">${pme_th}</td>
            <td style="text-align: center; font-weight: 700; color: ${oec_th > 0 ? '#1e40af' : '#94a3b8'};">${oec_th}</td>
            <td style="text-align: center; font-weight: 700; color: ${vec_th > 0 ? '#1e40af' : '#94a3b8'}; border-right: 1.5px solid #cbd5e1;">${vec_th}</td>
            
            <!-- Lab Columns -->
            <td style="text-align: center; font-weight: 700; color: ${sdc_lab > 0 ? '#b45309' : '#94a3b8'};">${sdc_lab}</td>
            <td style="text-align: center; font-weight: 700; color: ${dsa_lab > 0 ? '#b45309' : '#94a3b8'};">${dsa_lab}</td>
            <td style="text-align: center; font-weight: 700; color: ${vsec_lab > 0 ? '#b45309' : '#94a3b8'}; border-right: 1.5px solid #cbd5e1;">${vsec_lab}</td>

            <!-- Total Combined -->
            <td style="text-align: center; background: #dcfce7;"><strong style="color: #166534; font-size: 0.95rem;">${total_act}</strong></td>
          </tr>
        `;
      }).join('') || `<tr><td colspan="17" style="text-align: center; color: var(--text-muted); padding: 2rem;">No certificate records found.</td></tr>`;

      const currentDate = new Date().toISOString().split('T')[0];

      return `
        <div class="dashboard-container">
          <!-- Official Print Header -->
          <div class="print-only-header" style="display: none; margin-bottom: 1rem; text-align: center; border-bottom: 2px solid #000; padding-bottom: 0.5rem;">
            <h3 style="font-family: var(--font-heading); font-size: 1.3rem; font-weight: 800; text-transform: uppercase; margin: 0;">Electronics & Computer Engineering Department</h3>
            <h4 style="font-size: 1rem; font-weight: 700; margin: 0.2rem 0 0;">Official Student Lecture & Practical Lab Attendance Summary</h4>
            <p style="font-size: 0.78rem; color: #444; margin: 0.1rem 0 0;">Academic Year: 2026-27 | Date: ${currentDate}</p>
          </div>

          <!-- TOP DIVISION PILL CONTROLLER -->
          <div style="display: flex; gap: 0.75rem; background: #f8fafc; padding: 0.6rem; border-radius: var(--radius-full); border: 1px solid var(--border-color); flex-wrap: wrap; align-items: center; margin-bottom: 1.5rem;">
            <button type="button" class="btn ${this.currentDivFilter === 'SE(ECE)-A' ? 'btn-primary' : 'btn-secondary'} btn-sm" id="btn-report-div-a" onclick="ReportsView.switchDivisionFilter('SE(ECE)-A')" style="border-radius: var(--radius-full); font-weight: 800; padding: 0.45rem 1.15rem;">
              <i class="fa-solid fa-users-rectangle"></i> SE(ECE) Division A (${divAStudents.length} Students)
            </button>

            <button type="button" class="btn ${this.currentDivFilter === 'SE(ECE)-B' ? 'btn-primary' : 'btn-secondary'} btn-sm" id="btn-report-div-b" onclick="ReportsView.switchDivisionFilter('SE(ECE)-B')" style="border-radius: var(--radius-full); font-weight: 800; padding: 0.45rem 1.15rem;">
              <i class="fa-solid fa-users-rectangle"></i> SE(ECE) Division B (${divBStudents.length} Students)
            </button>

            <button type="button" class="btn ${this.currentDivFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'} btn-sm" id="btn-report-div-all" onclick="ReportsView.switchDivisionFilter('ALL')" style="border-radius: var(--radius-full); font-weight: 800; padding: 0.45rem 1.15rem;">
              <i class="fa-solid fa-layer-group"></i> View Both Divisions (${cumulativeStudents.length})
            </button>

            <div style="margin-left: auto; display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button class="btn btn-success btn-sm" onclick="ReportsView.exportExcelMasterSheet()" style="background: #16a34a; border-color: #16a34a; font-weight: 800; border-radius: var(--radius-full); padding: 0.45rem 1rem;">
                <i class="fa-solid fa-file-excel"></i> Export Excel Master Sheet
              </button>
              <button class="btn btn-secondary btn-sm" onclick="window.print()" style="font-weight: 800; border-radius: var(--radius-full); padding: 0.45rem 1rem;">
                <i class="fa-solid fa-print"></i> Print Report
              </button>
            </div>
          </div>

          <!-- PART 1: DIVISION SE(ECE)-A SUMMARY TABLE -->
          <div class="glass-panel" id="section-report-div-a" style="margin-bottom: 2rem; ${(this.currentDivFilter === 'SE(ECE)-B') ? 'display: none;' : ''}">
            <div class="panel-header" style="border-bottom: 2px solid var(--primary); padding-bottom: 0.75rem; margin-bottom: 1rem;">
              <h3>
                <i class="fa-solid fa-users-rectangle" style="color: var(--primary);"></i> Division SE(ECE)-A Official Attendance Matrix (${divAStudents.length} Students)
              </h3>
            </div>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1rem;">
              Separated <strong>Theory Lectures</strong> & <strong>Practical Lab Sessions</strong> matrix for Division A (Roll 01 to Roll 62):
            </p>
            <div class="table-responsive" style="overflow-x: auto; width: 100%;">
              <table class="custom-table" style="font-size: 0.83rem; border-collapse: separate; border-spacing: 0; min-width: 950px;">
                <thead>
                  <tr style="background: #e0f2fe; text-align: center; font-size: 0.8rem; font-weight: 800;">
                    <th colspan="4" style="border-right: 2px solid #94a3b8; background: #e2e8f0; color: #1e293b; white-space: nowrap;">STUDENT INFORMATION</th>
                    <th colspan="7" style="border-right: 2px solid #94a3b8; background: #dbeafe; color: #1e40af; white-space: nowrap;">THEORY LECTURES CREDITED</th>
                    <th colspan="3" style="border-right: 2px solid #94a3b8; background: #fef3c7; color: #92400e; white-space: nowrap;">PRACTICAL / LAB SESSIONS</th>
                    <th colspan="3" style="background: #dcfce7; color: #166534; white-space: nowrap; min-width: 185px;">TOTAL ATTENDANCE SUMMARY</th>
                  </tr>
                  <tr style="background: #f1f5f9;">
                    <th style="width: 45px; text-align: center;">Roll</th>
                    <th style="min-width: 170px;">Student Name</th>
                    <th>PRN Number</th>
                    <th style="border-right: 2px solid #94a3b8;">Div & Batch</th>
                    
                    <!-- Theory Subjects -->
                    <th style="text-align: center; width: 38px; background: #eff6ff;">SS</th>
                    <th style="text-align: center; width: 38px; background: #eff6ff;">DSA</th>
                    <th style="text-align: center; width: 38px; background: #eff6ff;">SDC</th>
                    <th style="text-align: center; width: 38px; background: #eff6ff;">FDS</th>
                    <th style="text-align: center; width: 38px; background: #eff6ff;">PME</th>
                    <th style="text-align: center; width: 38px; background: #eff6ff;">OEC</th>
                    <th style="text-align: center; width: 38px; background: #eff6ff; border-right: 2px solid #94a3b8;">VEC</th>
                    
                    <!-- Lab Subjects -->
                    <th style="text-align: center; width: 50px; background: #fffbeb;">SDC Lab</th>
                    <th style="text-align: center; width: 50px; background: #fffbeb;">DSA Lab</th>
                    <th style="text-align: center; width: 50px; background: #fffbeb; border-right: 2px solid #94a3b8;">VSEC Lab</th>

                    <!-- Totals -->
                    <th style="text-align: center; min-width: 55px; background: #f8fafc;">Theory</th>
                    <th style="text-align: center; min-width: 55px; background: #f8fafc; border-right: 2px solid #94a3b8;">Labs</th>
                    <th style="text-align: center; min-width: 75px; background: #dcfce7; color: #166534;">Combined</th>
                  </tr>
                </thead>
                <tbody>
                  ${divARows}
                </tbody>
              </table>
            </div>
          </div>

          <!-- PART 2: DIVISION SE(ECE)-B SUMMARY TABLE -->
          <div class="glass-panel" id="section-report-div-b" style="margin-bottom: 2rem; ${(this.currentDivFilter === 'SE(ECE)-A') ? 'display: none;' : ''}">
            <div class="panel-header" style="border-bottom: 2px solid #d97706; padding-bottom: 0.75rem; margin-bottom: 1rem;">
              <h3>
                <i class="fa-solid fa-users-rectangle" style="color: #d97706;"></i> Division SE(ECE)-B Official Attendance Matrix (${divBStudents.length} Students)
              </h3>
            </div>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1rem;">
              Separated <strong>Theory Lectures</strong> & <strong>Practical Lab Sessions</strong> matrix for Division B (Roll 01 to Roll 61):
            </p>
            <div class="table-responsive" style="overflow-x: auto; width: 100%;">
              <table class="custom-table" style="font-size: 0.83rem; border-collapse: separate; border-spacing: 0; min-width: 950px;">
                <thead>
                  <tr style="background: #e0f2fe; text-align: center; font-size: 0.8rem; font-weight: 800;">
                    <th colspan="4" style="border-right: 2px solid #94a3b8; background: #e2e8f0; color: #1e293b; white-space: nowrap;">STUDENT INFORMATION</th>
                    <th colspan="7" style="border-right: 2px solid #94a3b8; background: #dbeafe; color: #1e40af; white-space: nowrap;">THEORY LECTURES CREDITED</th>
                    <th colspan="3" style="border-right: 2px solid #94a3b8; background: #fef3c7; color: #92400e; white-space: nowrap;">PRACTICAL / LAB SESSIONS</th>
                    <th colspan="3" style="background: #dcfce7; color: #166534; white-space: nowrap; min-width: 185px;">TOTAL ATTENDANCE SUMMARY</th>
                  </tr>
                  <tr style="background: #fffbeb;">
                    <th style="width: 45px; text-align: center;">Roll</th>
                    <th style="min-width: 170px;">Student Name</th>
                    <th>PRN Number</th>
                    <th style="border-right: 2px solid #94a3b8;">Div & Batch</th>
                    
                    <!-- Theory Subjects -->
                    <th style="text-align: center; width: 38px; background: #eff6ff;">SS</th>
                    <th style="text-align: center; width: 38px; background: #eff6ff;">DSA</th>
                    <th style="text-align: center; width: 38px; background: #eff6ff;">SDC</th>
                    <th style="text-align: center; width: 38px; background: #eff6ff;">FDS</th>
                    <th style="text-align: center; width: 38px; background: #eff6ff;">PME</th>
                    <th style="text-align: center; width: 38px; background: #eff6ff;">OEC</th>
                    <th style="text-align: center; width: 38px; background: #eff6ff; border-right: 2px solid #94a3b8;">VEC</th>
                    
                    <!-- Lab Subjects -->
                    <th style="text-align: center; width: 50px; background: #fffbeb;">SDC Lab</th>
                    <th style="text-align: center; width: 50px; background: #fffbeb;">DSA Lab</th>
                    <th style="text-align: center; width: 50px; background: #fffbeb; border-right: 2px solid #94a3b8;">VSEC Lab</th>

                    <!-- Totals -->
                    <th style="text-align: center; min-width: 55px; background: #f8fafc;">Theory</th>
                    <th style="text-align: center; min-width: 55px; background: #f8fafc; border-right: 2px solid #94a3b8;">Labs</th>
                    <th style="text-align: center; min-width: 75px; background: #dcfce7; color: #166534;">Combined</th>
                  </tr>
                </thead>
                <tbody>
                  ${divBRows}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Individual Certificate History Log -->
          <div class="glass-panel">
            <div class="panel-header">
              <h3><i class="fa-solid fa-chart-pie"></i> Certificate Submissions & Logs</h3>
              <button class="btn btn-success btn-sm" onclick="ReportsView.exportCSV()" style="background: #16a34a; border-color: #16a34a; font-weight: 700;">
                <i class="fa-solid fa-file-csv"></i> Export Certificate Logs CSV
              </button>
            </div>

            <div class="table-responsive" style="margin-top: 1rem; overflow-x: auto; width: 100%;">
              <table class="custom-table" id="table-reports" style="font-size: 0.81rem; min-width: 900px;">
                <thead>
                  <tr style="background: #f1f5f9;">
                    <th style="width: 35px; text-align: center;">#</th>
                    <th>Student Details</th>
                    <th>Division</th>
                    <th>Event & Category</th>
                    <th>Date</th>
                    <th>Status</th>
                    
                    <th style="text-align: center; width: 30px;">SS</th>
                    <th style="text-align: center; width: 30px;">DSA</th>
                    <th style="text-align: center; width: 30px;">SDC</th>
                    <th style="text-align: center; width: 30px;">FDS</th>
                    <th style="text-align: center; width: 30px;">PME</th>
                    <th style="text-align: center; width: 30px;">OEC</th>
                    <th style="text-align: center; width: 30px; border-right: 1.5px solid #cbd5e1;">VEC</th>

                    <th style="text-align: center; width: 45px;">SDC Lab</th>
                    <th style="text-align: center; width: 45px;">DSA Lab</th>
                    <th style="text-align: center; width: 45px; border-right: 1.5px solid #cbd5e1;">VSEC Lab</th>

                    <th style="text-align: center; width: 50px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${certRows}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    } catch(err) {
      return `<div class="dashboard-container"><div class="glass-panel" style="color: red;">Failed to load reports: ${err.message}</div></div>`;
    }
  },

  async exportExcelMasterSheet() {
    try {
      const data = await API.get('/api/reports');
      const students = data.cumulative_student_summary || [];
      if (!students.length) {
        Toast.error('No report data available to export.');
        return;
      }

      const formatStudentRow = (s) => {
        const ss_th = s.SS_TH !== undefined ? s.SS_TH : (s.SS || 0);
        const dsa_th = s.DSA_TH !== undefined ? s.DSA_TH : (s.DSA || 0);
        const sdc_th = s.SDC_TH !== undefined ? s.SDC_TH : (s.SDC || 0);
        const fds_th = s.FDS_TH !== undefined ? s.FDS_TH : (s.FDS || 0);
        const pme_th = s.PME_TH !== undefined ? s.PME_TH : (s.PME || 0);
        const oec_th = s.OEC_TH !== undefined ? s.OEC_TH : (s.OEC || 0);
        const vec_th = s.VEC_TH !== undefined ? s.VEC_TH : (s.VEC || 0);
        const total_th = s.total_theory !== undefined ? s.total_theory : (ss_th + dsa_th + sdc_th + fds_th + pme_th + oec_th + vec_th);

        const sdc_lab = s.SDC_LAB !== undefined ? s.SDC_LAB : 0;
        const dsa_lab = s.DSA_LAB !== undefined ? s.DSA_LAB : 0;
        const vsec_lab = s.VSEC_LAB !== undefined ? s.VSEC_LAB : (s.VSEC || 0);
        const total_lab = s.total_lab !== undefined ? s.total_lab : (sdc_lab + dsa_lab + vsec_lab);

        const combined = s.total_accumulated_activities !== undefined ? s.total_accumulated_activities : (total_th + total_lab);

        return {
          'Roll No': s.roll_no || '',
          'Student Name': s.student_name || '',
          'PRN Number': s.prn_no || '',
          'Division': s.division_name || '',
          'Batch': s.batch_name || '',
          'SS (Theory)': ss_th,
          'DSA (Theory)': dsa_th,
          'SDC (Theory)': sdc_th,
          'FDS (Theory)': fds_th,
          'PME (Theory)': pme_th,
          'OEC (Theory)': oec_th,
          'VEC (Theory)': vec_th,
          'Total Theory Lectures': total_th,
          'SDC Lab': sdc_lab,
          'DSA Lab': dsa_lab,
          'VSEC Lab': vsec_lab,
          'Total Lab Sessions': total_lab,
          'Total Combined Compensated Attendance': combined
        };
      };

      const divARows = students.filter(s => s.division_name === 'SE(ECE)-A' || (s.division_id && s.division_id == 1)).map(formatStudentRow);
      const divBRows = students.filter(s => s.division_name === 'SE(ECE)-B' || (s.division_id && s.division_id == 2)).map(formatStudentRow);
      const allRows = students.map(formatStudentRow);

      const sheetsMap = {
        'SE(ECE)-A Attendance Matrix': divARows,
        'SE(ECE)-B Attendance Matrix': divBRows,
        'All Divisions Combined Master': allRows
      };

      const exportedXLSX = Exporter.exportMultiSheetXLSX(`ECE_Student_Attendance_Master_${new Date().toISOString().split('T')[0]}`, sheetsMap);

      if (!exportedXLSX) {
        // Fallback to CSV if XLSX engine is absent
        let csv = 'Roll No,Student Name,PRN Number,Division,Batch,SS (Theory),DSA (Theory),SDC (Theory),FDS (Theory),PME (Theory),OEC (Theory),VEC (Theory),Total Theory Lectures Credited,SDC Lab,DSA Lab,VSEC Lab,Total Lab Sessions Credited,Total Combined Compensated Attendance (Theory + Labs)\n';
        students.forEach(s => {
          const r = formatStudentRow(s);
          const cleanName = `"${r['Student Name'].replace(/"/g, '""')}"`;
          const row = [
            r['Roll No'], cleanName, `"${r['PRN Number']}"`, `"${r['Division']}"`, `"${r['Batch']}"`,
            r['SS (Theory)'], r['DSA (Theory)'], r['SDC (Theory)'], r['FDS (Theory)'], r['PME (Theory)'], r['OEC (Theory)'], r['VEC (Theory)'],
            r['Total Theory Lectures'], r['SDC Lab'], r['DSA Lab'], r['VSEC Lab'], r['Total Lab Sessions'], r['Total Combined Compensated Attendance']
          ];
          csv += row.join(',') + '\n';
        });

        Exporter.downloadCSV(csv, `ECE_Student_Attendance_Master_${new Date().toISOString().split('T')[0]}.csv`);
      }

      Toast.success('🎉 Master Excel sheet generated and downloaded successfully!');
    } catch(e) {
      console.error('Export error:', e);
      Toast.error('Failed to export Excel file.');
    }
  },

  async exportCSV() {
    try {
      const data = await API.get('/api/reports');
      const reports = data.reports || [];
      if (!reports.length) {
        Toast.error('No certificate records available to export.');
        return;
      }
      let csv = 'Sr No,Student Name,Roll No,PRN,Division,Batch,Event Name,Category,Certificate Date,Status,SS (Theory),DSA (Theory),SDC (Theory),FDS (Theory),PME (Theory),OEC (Theory),VEC (Theory),Total Theory,SDC Lab,DSA Lab,VSEC Lab,Total Labs,Total Combined Activities\n';
      reports.forEach((r, i) => {
        const ss_th = r.SS_TH !== undefined ? r.SS_TH : (r.SS || 0);
        const dsa_th = r.DSA_TH !== undefined ? r.DSA_TH : (r.DSA || 0);
        const sdc_th = r.SDC_TH !== undefined ? r.SDC_TH : (r.SDC || 0);
        const fds_th = r.FDS_TH !== undefined ? r.FDS_TH : (r.FDS || 0);
        const pme_th = r.PME_TH !== undefined ? r.PME_TH : (r.PME || 0);
        const oec_th = r.OEC_TH !== undefined ? r.OEC_TH : (r.OEC || 0);
        const vec_th = r.VEC_TH !== undefined ? r.VEC_TH : (r.VEC || 0);
        const total_th = r.total_theory !== undefined ? r.total_theory : (ss_th + dsa_th + sdc_th + fds_th + pme_th + oec_th + vec_th);

        const sdc_lab = r.SDC_LAB !== undefined ? r.SDC_LAB : 0;
        const dsa_lab = r.DSA_LAB !== undefined ? r.DSA_LAB : 0;
        const vsec_lab = r.VSEC_LAB !== undefined ? r.VSEC_LAB : (r.VSEC || 0);
        const total_lab = r.total_lab !== undefined ? r.total_lab : (sdc_lab + dsa_lab + vsec_lab);

        const total_act = r.total_activities !== undefined ? r.total_activities : (total_th + total_lab);

        csv += `${i+1},"${r.student_name}","${r.roll_no}","${r.prn_no}","${r.division_name}","${r.batch_name}","${r.event_name}","${r.category}","${r.certificate_date}","${r.status}",${ss_th},${dsa_th},${sdc_th},${fds_th},${pme_th},${oec_th},${vec_th},${total_th},${sdc_lab},${dsa_lab},${vsec_lab},${total_lab},${total_act}\n`;
      });
      Exporter.downloadCSV(csv, `ECE_Certificate_Logs_${new Date().toISOString().split('T')[0]}.csv`);
      Toast.success('Certificate Logs CSV downloaded successfully!');
    } catch(e) {
      Toast.error('Failed to export CSV file.');
    }
  }
};
