
window.addDelivery = function(order){
  const amount = Number(prompt("Delivery amount"));
  if(!amount) return;

  order.delivered = (order.delivered || 0) + amount;

  if(order.delivered >= order.total){
    order.status = "Closed";
  } else {
    order.status = "Partial";
  }
};

window.addInvoice = function(order){
  const amount = Number(prompt("Invoice amount"));
  if(!amount) return;

  if(!order.invoices) order.invoices = [];

  order.invoices.push({
    amount,
    paid: 0,
    credits: []
  });
};

window.addPayment = function(invoice){
  const amount = Number(prompt("Payment amount"));
  if(!amount) return;

  invoice.paid += amount;
};

window.addCredit = function(invoice){
  const amount = Number(prompt("Credit amount"));
  if(!amount) return;

  invoice.credits.push(amount);
};

window.calcInvoice = function(invoice){
  const credits = invoice.credits.reduce((a,b)=>a+b,0);
  return invoice.amount - invoice.paid - credits;
};

window.calcOrder = function(order){
  let invoiced = 0, paid = 0, credits = 0;

  (order.invoices || []).forEach(i=>{
    invoiced += i.amount;
    paid += i.paid;
    credits += i.credits.reduce((a,b)=>a+b,0);
  });

  return {
    delivered: order.delivered || 0,
    openDelivery: order.total - (order.delivered || 0),
    outstanding: invoiced - paid - credits
  };
};
