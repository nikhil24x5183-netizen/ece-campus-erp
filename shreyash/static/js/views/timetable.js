/* Official College Timetable Grid Controller — Division Tabs, Split/Continuous Slots & Isolation */
const Timetable = {
  selectedDeptId: 1,
  selectedSemId: 1,
  selectedAcadYear: '2026-27',
  activeDivisionFilter: 'ALL', // 'ALL', 'DIV_A', 'DIV_B'
  meta: null,

  async render(readOnly = false) {
    try {
      if (!this.meta) {
        this.meta = await API.get('/api/meta');
      }

      const divA = (this.meta.divisions || []).find(d => d.name.includes('-A')) || { id: 1, name: 'SE(ECE)-A' };
      const divB = (this.meta.divisions || []).find(d => d.name.includes('-B')) || { id: 2, name: 'SE(ECE)-B' };

      // Student Division Isolation Check
      const isStudent = (window.currentUser && window.currentUser.role === 'STUDENT');
      if (isStudent && App.currentProfile) {
        const studentDivId = App.currentProfile.division_id;
        if (studentDivId == divB.id) {
          this.activeDivisionFilter = 'DIV_B';
        } else {
          this.activeDivisionFilter = 'DIV_A';
        }
      }

      // Fetch timetable entries
      const res = await API.get(`/api/timetable?department_id=${this.selectedDeptId}&semester_id=${this.selectedSemId}&academic_year=${this.selectedAcadYear}`);
      const entries = res.timetable || [];

      // Organize by day, division_id, and time_slot_id
      const grid = {};
      entries.forEach(e => {
        const day = e.day_of_week;
        const divId = e.division_id;
        const slotId = e.time_slot_id;
        if (!grid[day]) grid[day] = {};
        if (!grid[day][divId]) grid[day][divId] = {};
        if (!grid[day][divId][slotId]) grid[day][divId][slotId] = [];
        grid[day][divId][slotId].push(e);
      });

      const days = [
        { code: 'Monday', short: 'Mon' },
        { code: 'Tuesday', short: 'Tue' },
        { code: 'Wednesday', short: 'Wed' },
        { code: 'Thursday', short: 'Thu' },
        { code: 'Friday', short: 'Fri' }
      ];

      const timeSlots = (this.meta.time_slots || []).sort((a,b) => a.display_order - b.display_order);

      // Determine active target divisions based on activeDivisionFilter
      let targetDivisions = [divA, divB];
      if (this.activeDivisionFilter === 'DIV_A') targetDivisions = [divA];
      if (this.activeDivisionFilter === 'DIV_B') targetDivisions = [divB];

      const rowSpanTotal = days.length * targetDivisions.length;

      // Helper to render card HTML
      const renderCard = (e) => {
        const batchTag = e.batch_name ? `<span class="tt-batch-tag">${e.batch_name}</span> ` : '';
        const isHighlight = (e.subject_code && (e.subject_code.includes('PP') || e.subject_code.includes('TUT'))) ? 'highlight-yellow' : '';
        return `
          <div class="tt-card ${isHighlight} card-${e.activity_type}" onclick="${readOnly ? '' : `Timetable.openEditModal(${e.id}, '${e.day_of_week}', ${e.time_slot_id}, ${e.division_id})`}">
            <div class="tt-subject">
              <span>${batchTag}${e.subject_code || e.subject_name || 'FREE'}</span>
            </div>
            ${e.room ? `<div class="tt-meta"><span>${e.room}</span></div>` : ''}
          </div>
        `;
      };

      // Build HTML rows for each day
      let tableRowsHtml = '';

      days.forEach((dayObj, dayIndex) => {
        const dayCode = dayObj.code;
        const dayShort = dayObj.short;

        targetDivisions.forEach((div, divIdx) => {
          const isFirstDivRow = divIdx === 0;

          // Day Cell
          const dayTd = isFirstDivRow ? `<td rowspan="${targetDivisions.length}" class="day-header-cell">${dayShort}</td>` : '';
          
          // Division Cell
          const divTd = `<td class="div-header-cell">${div.name}</td>`;

          // Slot Cells
          const slotTds = timeSlots.map((slot) => {
            if (slot.is_break === 1) {
              if (dayIndex === 0 && divIdx === 0) {
                return `<td rowspan="${rowSpanTotal}" class="cell-break">${slot.name}</td>`;
              } else {
                return '';
              }
            }

            const slotEntries = (grid[dayCode] && grid[dayCode][div.id] && grid[dayCode][div.id][slot.id]) || [];

            let filteredEntries = slotEntries;
            if (isStudent && App.currentProfile && App.currentProfile.batch_id) {
              filteredEntries = slotEntries.filter(e => (!e.batch_id || e.batch_id == App.currentProfile.batch_id));
            }

            // Check if there are split sub-slots (sub_slot 1 and sub_slot 2)
            const subSlot1Entries = filteredEntries.filter(e => e.sub_slot === 1);
            const subSlot2Entries = filteredEntries.filter(e => e.sub_slot === 2);

            if (subSlot1Entries.length > 0 || subSlot2Entries.length > 0) {
              // Render as two split 1-hour sub-columns with vertical dividing border line!
              const col1Cards = subSlot1Entries.map(renderCard).join('') || (readOnly ? '-' : `<button class="btn btn-secondary btn-sm" style="padding: 0.15rem 0.4rem; font-size: 0.68rem; opacity: 0.6;" onclick="Timetable.openAddModal('${dayCode}', ${slot.id}, ${div.id}, 1)">+ Add</button>`);
              const col2Cards = subSlot2Entries.map(renderCard).join('') || (readOnly ? '-' : `<button class="btn btn-secondary btn-sm" style="padding: 0.15rem 0.4rem; font-size: 0.68rem; opacity: 0.6;" onclick="Timetable.openAddModal('${dayCode}', ${slot.id}, ${div.id}, 2)">+ Add</button>`);

              return `
                <td style="padding: 0.3rem;">
                  <div style="display: flex; width: 100%; height: 100%; align-items: stretch;">
                    <div style="flex: 1; border-right: 1.5px solid #cbd5e1; padding-right: 0.35rem; margin-right: 0.35rem; display: flex; flex-direction: column; justify-content: center;">
                      ${col1Cards}
                    </div>
                    <div style="flex: 1; padding-left: 0.15rem; display: flex; flex-direction: column; justify-content: center;">
                      ${col2Cards}
                    </div>
                  </div>
                </td>
              `;
            }

            // Otherwise: Continuous 2-Hour Lecture / Continuous Lab (NO line in between!)
            const cardsHtml = filteredEntries.map(renderCard).join('') || (readOnly ? '<span style="color: var(--text-muted); font-size: 0.72rem;">-</span>' : `
              <button class="btn btn-secondary btn-sm" style="padding: 0.2rem 0.5rem; font-size: 0.7rem; opacity: 0.6;" onclick="Timetable.openAddModal('${dayCode}', ${slot.id}, ${div.id}, 0)">
                + Add
              </button>
            `);

            return `<td>${cardsHtml}</td>`;
          }).join('');

          tableRowsHtml += `<tr>${dayTd}${divTd}${slotTds}</tr>`;
        });
      });

      // Teacher Division Filter Switcher Bar
      const teacherDivTabsHtml = readOnly ? '' : `
        <div style="display: flex; gap: 0.5rem; margin-bottom: 1.25rem; background: #f1f5f9; padding: 0.4rem; border-radius: var(--radius-full); width: fit-content; border: 1px solid var(--border-color);">
          <button class="btn btn-sm ${this.activeDivisionFilter === 'DIV_A' ? 'btn-primary' : 'btn-secondary'}" onclick="Timetable.switchDivisionFilter('DIV_A')">
            <i class="fa-solid fa-pen-to-square"></i> Edit Div A Timetable (${divA.name})
          </button>
          <button class="btn btn-sm ${this.activeDivisionFilter === 'DIV_B' ? 'btn-primary' : 'btn-secondary'}" onclick="Timetable.switchDivisionFilter('DIV_B')">
            <i class="fa-solid fa-pen-to-square"></i> Edit Div B Timetable (${divB.name})
          </button>
          <button class="btn btn-sm ${this.activeDivisionFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}" onclick="Timetable.switchDivisionFilter('ALL')">
            <i class="fa-solid fa-table-cells"></i> Combined View (Div A & B)
          </button>
        </div>
      `;

      // Active title label
      const activeLabel = this.activeDivisionFilter === 'DIV_A' ? `Division SE(ECE)-A Schedule` :
                         (this.activeDivisionFilter === 'DIV_B' ? `Division SE(ECE)-B Schedule` : `Combined SE(ECE)-A & SE(ECE)-B Schedule`);

      return `
        <div class="dashboard-container">
          <div class="timetable-container">
            <div class="timetable-header-info">
              <div>
                <h2><i class="fa-solid fa-calendar-days" style="color: var(--primary);"></i> Electronics & Computer Engineering — ${activeLabel}</h2>
                <span style="color: var(--text-muted); font-size: 0.85rem;">Academic Year: ${this.selectedAcadYear} | Semester 3 | ${isStudent ? `Student View (${App.currentProfile ? App.currentProfile.division_name : 'Assigned Division'})` : 'Faculty Management Mode'}</span>
              </div>
              <div style="display: flex; gap: 0.75rem; align-items: center;">
                ${readOnly ? '' : `
                  <button class="btn btn-secondary btn-sm" onclick="Timetable.openCopyModal()"><i class="fa-solid fa-copy"></i> Copy Tools</button>
                `}
                <button class="btn btn-primary btn-sm" onclick="Exporter.printPage()"><i class="fa-solid fa-print"></i> Print Official Timetable</button>
              </div>
            </div>

            ${teacherDivTabsHtml}

            <table class="timetable-grid">
              <thead>
                <tr>
                  <th style="width: 60px;">Day</th>
                  <th style="width: 100px;">Division</th>
                  <th>08.30 TO 09.30</th>
                  <th>09.30 TO 10.30</th>
                  <th style="width: 45px;">SHORT BREAK</th>
                  <th>10.40 TO 11.40</th>
                  <th>11.40 TO 12.40</th>
                  <th style="width: 45px;">LUNCH BREAK</th>
                  <th>01.30 TO 03.30</th>
                </tr>
              </thead>
              <tbody>
                ${tableRowsHtml}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      return `<div class="dashboard-container"><p style="color: var(--accent-rose);">Failed to load timetable: ${err.message}</p></div>`;
    }
  },

  async switchDivisionFilter(filterMode) {
    this.activeDivisionFilter = filterMode;
    const viewContainer = document.getElementById('view-container');
    const isStudent = (window.currentUser && window.currentUser.role === 'STUDENT');
    viewContainer.innerHTML = await this.render(isStudent);
  },

  openAddModal(day, slotId, divId, subSlot = 0) {
    this.populateModalDropdowns(divId);
    document.getElementById('tt-entry-id').value = '';
    document.getElementById('tt-day').value = day;
    document.getElementById('tt-slot').value = slotId;
    document.getElementById('tt-activity-type').value = 'THEORY';
    document.getElementById('tt-batch').value = '';
    document.getElementById('tt-room').value = 'Room 105';
    document.getElementById('btn-delete-tt').style.display = 'none';

    document.getElementById('form-timetable-entry').onsubmit = (e) => this.handleSaveEntry(e, divId, subSlot);
    openModal('modal-timetable-edit');
  },

  async openEditModal(entryId, day, slotId, divId) {
    this.populateModalDropdowns(divId);
    try {
      const res = await API.get(`/api/timetable?department_id=${this.selectedDeptId}&semester_id=${this.selectedSemId}&academic_year=${this.selectedAcadYear}`);
      const entry = (res.timetable || []).find(e => e.id == entryId);
      if (!entry) return;

      document.getElementById('tt-entry-id').value = entry.id;
      document.getElementById('tt-day').value = entry.day_of_week;
      document.getElementById('tt-slot').value = entry.time_slot_id;
      document.getElementById('tt-activity-type').value = entry.activity_type;
      document.getElementById('tt-subject').value = entry.subject_id || '';
      document.getElementById('tt-batch').value = entry.batch_id || '';
      document.getElementById('tt-teacher').value = entry.teacher_id || '';
      document.getElementById('tt-room').value = entry.room || '';

      const btnDelete = document.getElementById('btn-delete-tt');
      btnDelete.style.display = 'inline-block';
      btnDelete.onclick = () => this.handleDeleteEntry(entry.id);

      document.getElementById('form-timetable-entry').onsubmit = (e) => this.handleSaveEntry(e, divId, entry.sub_slot || 0);
      openModal('modal-timetable-edit');
    } catch (err) {
      Toast.error('Failed to load entry.');
    }
  },

  populateModalDropdowns(divId) {
    if (!this.meta) return;

    document.getElementById('tt-slot').innerHTML = (this.meta.time_slots || []).map(s => 
      `<option value="${s.id}">${s.name} (${s.start_time}-${s.end_time})</option>`
    ).join('');

    document.getElementById('tt-subject').innerHTML = `<option value="">Select Subject</option>` + (this.meta.subjects || []).map(s => 
      `<option value="${s.id}">${s.name} (${s.code})</option>`
    ).join('');

    const divBatches = (this.meta.batches || []).filter(b => b.division_id == divId);
    document.getElementById('tt-batch').innerHTML = `<option value="">All Division (Whole Class)</option>` + divBatches.map(b => 
      `<option value="${b.id}">Batch ${b.name}</option>`
    ).join('');

    document.getElementById('tt-teacher').innerHTML = `<option value="">Select Teacher</option>` + (this.meta.teachers || []).map(t => 
      `<option value="${t.id}">${t.name}</option>`
    ).join('');
  },

  async handleSaveEntry(e, divId, subSlot = 0) {
    e.preventDefault();
    const payload = {
      id: document.getElementById('tt-entry-id').value || null,
      department_id: this.selectedDeptId,
      semester_id: this.selectedSemId,
      division_id: divId,
      academic_year: this.selectedAcadYear,
      day_of_week: document.getElementById('tt-day').value,
      time_slot_id: document.getElementById('tt-slot').value,
      sub_slot: subSlot,
      activity_type: document.getElementById('tt-activity-type').value,
      subject_id: document.getElementById('tt-subject').value || null,
      batch_id: document.getElementById('tt-batch').value || null,
      teacher_id: document.getElementById('tt-teacher').value || null,
      room: document.getElementById('tt-room').value
    };

    try {
      const res = await API.post('/api/timetable', payload);
      Toast.success(res.message || 'Timetable saved.');
      closeModal('modal-timetable-edit');
      const viewContainer = document.getElementById('view-container');
      viewContainer.innerHTML = await this.render(window.currentUser && window.currentUser.role === 'STUDENT');
    } catch (err) {
      Toast.error(err.message || 'Failed to save timetable entry.');
    }
  },

  async handleDeleteEntry(entryId) {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    try {
      await API.delete(`/api/timetable/${entryId}`);
      Toast.success('Entry deleted.');
      closeModal('modal-timetable-edit');
      const viewContainer = document.getElementById('view-container');
      viewContainer.innerHTML = await this.render(window.currentUser && window.currentUser.role === 'STUDENT');
    } catch (err) {
      Toast.error(err.message || 'Failed to delete entry.');
    }
  },

  async openCopyModal() {
    if (!confirm('Copy Division A schedule to Division B?')) return;
    try {
      const divA = (this.meta.divisions || []).find(d => d.name.includes('-A'));
      const divB = (this.meta.divisions || []).find(d => d.name.includes('-B'));
      const res = await API.post('/api/timetable/copy', {
        source_division_id: divA.id,
        target_division_id: divB.id
      });
      Toast.success(res.message);
      const viewContainer = document.getElementById('view-container');
      viewContainer.innerHTML = await this.render(window.currentUser && window.currentUser.role === 'STUDENT');
    } catch (err) {
      Toast.error('Failed to copy timetable.');
    }
  }
};
