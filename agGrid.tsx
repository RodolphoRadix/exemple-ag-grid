/*
AG Grid Community - Self-contained React component
- No props required: drop this file into your React project and render <AgGridCommunityDemo />
- Uses ag-grid-community + ag-grid-react (free/community features only)

Install:
  npm install ag-grid-community ag-grid-react

Usage:
  import AgGridCommunityDemo from './ag-grid-community-example';
  <AgGridCommunityDemo />

Features included (Community edition):
- Sorting, filtering (with floating filters)
- Column resizing and moving
- Pagination (client-side)
- Row selection with checkboxes
- Cell editing (text and number)
- CSV export
- Quick global search (quickFilter)
- Column auto-size and save/restore column state
- Custom cell renderer (Actions)
- 100 generated demo rows
*/

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { ClientSideRowModelModule } from 'ag-grid-community';

export default function AgGridCommunityDemo() {
  const gridRef = useRef(null);

  // Generate 100 demo rows
  const generateData = () => {
    const cities = ['São Paulo','Rio de Janeiro','Belo Horizonte','Porto Alegre','Curitiba','Salvador','Fortaleza','Recife','Manaus','Brasília'];
    const products = ['Vinho','Café','Queijo','Cerveja','Chocolate','Azeite','Pão','Suco','Arroz','Feijão'];
    const rows = [];
    for (let i = 1; i <= 100; i++) {
      rows.push({
        id: i,
        name: `Cliente ${i}`,
        age: Math.floor(Math.random() * 60) + 18,
        city: cities[i % cities.length],
        product: products[i % products.length],
        amount: (Math.random() * 1000).toFixed(2),
        active: i % 3 !== 0,
        joined: new Date(2020 + (i % 6), (i % 12), (i % 28) + 1).toISOString().slice(0,10),
      });
    }
    return rows;
  };

  const [rowData, setRowData] = useState(generateData());

  // Column definitions
  const [columnDefs] = useState([
    { headerName: 'ID', field: 'id', sortable: true, filter: 'agNumberColumnFilter', checkboxSelection: true, headerCheckboxSelection: true, width: 90 },
    { headerName: 'Nome', field: 'name', sortable: true, filter: 'agTextColumnFilter', editable: true, flex: 1 },
    { headerName: 'Idade', field: 'age', sortable: true, filter: 'agNumberColumnFilter', editable: true, width: 110 },
    { headerName: 'Cidade', field: 'city', sortable: true, filter: 'agTextColumnFilter', editable: true, width: 180 },
    { headerName: 'Produto', field: 'product', sortable: true, filter: 'agTextColumnFilter', editable: true, width: 180 },
    { headerName: 'Valor (R$)', field: 'amount', sortable: true, filter: 'agNumberColumnFilter', valueFormatter: params => formatCurrency(params.value), editable: true, width: 140 },
    { headerName: 'Ativo', field: 'active', sortable: true, filter: 'agSetColumnFilter', width: 120, cellRenderer: params => (params.value ? '✅' : '❌') },
    { headerName: 'Entrada', field: 'joined', sortable: true, filter: 'agDateColumnFilter', width: 140 },
    { headerName: 'Ações', field: 'actions', cellRenderer: actionCellRenderer, width: 120 }
  ]);

  // Default column definition
  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
    floatingFilter: true,
    minWidth: 70,
  }), []);

  const gridOptions = useMemo(() => ({
    pagination: true,
    paginationPageSize: 10,
    suppressRowClickSelection: false,
    rowSelection: 'multiple',
    animateRows: true,
    defaultColDef
  }), [defaultColDef]);

  // Helpers
  function formatCurrency(value) {
    if (value === undefined || value === null) return '';
    const num = Number(value);
    if (isNaN(num)) return value;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function actionCellRenderer(params) {
    // Simple React-less renderer (string + inline event via dataset). We'll attach events via grid callbacks.
    return `<div style="display:flex;gap:6px;justify-content:center;align-items:center;">
      <button data-action=\"edit\" data-id=\"${params.data?.id}\" style=\"padding:4px 6px;border-radius:6px;border:1px solid #bbb;background:#fff;cursor:pointer\">Editar</button>
      <button data-action=\"del\" data-id=\"${params.data?.id}\" style=\"padding:4px 6px;border-radius:6px;border:1px solid #e07;background:#fff;color:#d00;cursor:pointer\">Excluir</button>
    </div>`;
  }

  // grid ready
  const onGridReady = useCallback((params) => {
    gridRef.current = params.api;
    // optional: size columns to fit initially
    setTimeout(() => params.api.sizeColumnsToFit(), 0);
  }, []);

  // Quick filter (global search)
  const onFilterTextChange = (e) => {
    const value = e.target.value;
    gridRef.current.setQuickFilter(value);
  };

  // Export CSV
  const onExportCSV = () => {
    gridRef.current.exportDataAsCsv({ fileName: 'ag-grid-export.csv' });
  };

  // Auto-size all columns
  const onAutoSizeAll = () => {
    const allColumnIds = [];
    gridRef.current.getColumnDefs().forEach(col => allColumnIds.push(col.field || col.colId));
    const columnApi = gridRef.current.getColumnApi();
    columnApi.autoSizeColumns(allColumnIds);
  };

  // Save / restore column state
  const saveColumnState = () => {
    const colState = gridRef.current.getColumnState();
    localStorage.setItem('ag-grid-column-state', JSON.stringify(colState));
    alert('Column state saved to localStorage');
  };
  const restoreColumnState = () => {
    const raw = localStorage.getItem('ag-grid-column-state');
    if (!raw) return alert('No saved state');
    const state = JSON.parse(raw);
    gridRef.current.setColumnState(state);
    alert('Column state restored');
  };

  // Handle clicks from action cell buttons (edit/delete)
  const onCellClicked = useCallback((event) => {
    if (!event.event) return;
    const target = event.event.target;
    if (!target) return;
    const action = target.dataset?.action;
    const id = target.dataset?.id;
    if (!action || !id) return;

    if (action === 'del') {
      if (confirm('Excluir linha id=' + id + '?')) {
        setRowData(prev => prev.filter(r => String(r.id) !== String(id)));
      }
    }
    if (action === 'edit') {
      // simple demonstration: toggle 'active'
      setRowData(prev => prev.map(r => (String(r.id) === String(id) ? { ...r, active: !r.active } : r)));
    }
  }, []);

  // Add a new random row
  const onAddRow = () => {
    setRowData(prev => {
      const nextId = (prev.length ? Math.max(...prev.map(r => r.id)) : 0) + 1;
      const newRow = {
        id: nextId,
        name: `Cliente ${nextId}`,
        age: Math.floor(Math.random() * 60) + 18,
        city: ['São Paulo','Rio de Janeiro','Belo Horizonte','Porto Alegre'][nextId % 4],
        product: ['Vinho','Café','Queijo'][nextId % 3],
        amount: (Math.random() * 1000).toFixed(2),
        active: true,
        joined: new Date().toISOString().slice(0,10)
      };
      return [newRow, ...prev];
    });
  };

  // Refresh / reset data
  const onResetData = () => {
    if (!confirm('Resetar os 100 dados gerados inicialmente?')) return;
    setRowData(generateData());
  };

  return (
    <div style={{width: '100%', height: '100%'}}>
      <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
        <input placeholder="Pesquisar (global)" onChange={onFilterTextChange} style={{padding:8,borderRadius:6,border:'1px solid #ccc',minWidth:240}} />
        <button onClick={onAddRow} style={{padding:'8px 12px'}}>Adicionar linha</button>
        <button onClick={onExportCSV} style={{padding:'8px 12px'}}>Exportar CSV</button>
        <button onClick={onAutoSizeAll} style={{padding:'8px 12px'}}>Auto-size colunas</button>
        <button onClick={saveColumnState} style={{padding:'8px 12px'}}>Salvar colunas</button>
        <button onClick={restoreColumnState} style={{padding:'8px 12px'}}>Restaurar colunas</button>
        <button onClick={onResetData} style={{padding:'8px 12px',marginLeft:'auto'}}>Resetar dados</button>
      </div>

      <div className="ag-theme-alpine" style={{height: 600, width: '100%'}}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          onCellClicked={onCellClicked}
          pagination={true}
          paginationPageSize={10}
          domLayout={'normal'}
          undoRedoCellEditing={true}
          undoRedoCellEditingLimit={20}
          allowContextMenuWithControlKey={true}
          modules={[ClientSideRowModelModule]}  // ← obrigatório!!
        />
      </div>

      <div style={{marginTop:8,fontSize:12,color:'#666'}}>
        <strong>Nota:</strong> Este componente usa apenas recursos da edição Community (gratuita) do AG Grid. Recursos marcados como Enterprise (por exemplo, pivot, agrupamento avançado, Excel (xlsx) export) não são usados.
      </div>
    </div>
  );
}
