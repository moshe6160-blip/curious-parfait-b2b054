// PATCH: collect items correctly
function collectItemsFromTable(){
  const rows = document.querySelectorAll('#itemsTable tbody tr.data-row');
  const items = [];

  rows.forEach(row => {
    const description = row.querySelector('.desc')?.value || '';
    const qty = parseFloat(row.querySelector('.qty')?.value || 0);
    const price = parseFloat(row.querySelector('.price')?.value || 0);

    if(!description && qty === 0 && price === 0) return;

    items.push({ description, qty, price });
  });

  return items;
}

// PATCH: prevent overwrite empty
function safeSave(items, editingId){
  if(items.length === 0 && editingId){
    console.log("Prevent overwrite empty items");
    return false;
  }
  return true;
}
