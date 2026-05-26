import React from 'react';

const PDFContent = () => (
<div className="fixed left-[-9999px] top-0">
  <div id={`customer-pdf-content-${receipt.id}`} className="w-[1240px] min-h-[1754px] bg-white flex flex-col font-sans text-slate-900 text-left relative overflow-hidden">
    
    {/* HEADER WAVE & LOGO */}
    <div className="relative w-full h-[320px]">
      <svg className="absolute top-0 left-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1240 320" fill="none" xmlns="http://www.w3.org/2000/svg">
         <path d="M0,0 L1240,0 L1240,140 C950,140 850,280 400,280 C200,280 100,200 0,220 Z" className="fill-primary" />
         <path d="M0,0 L1240,0 L1240,110 C950,110 850,240 400,240 C200,240 100,160 0,180 Z" className="fill-primary brightness-75" />
      </svg>
      <div className="absolute top-12 right-20 text-white text-right">
        {studioLogo ? (
            <img src={studioLogo} className="h-20 w-auto ml-auto" crossOrigin="anonymous" alt="Logo" />
        ) : (
            <div className="text-4xl font-black tracking-tighter">VISUAL OSCART</div>
        )}
      </div>
    </div>

    <div className="px-20 pb-20 flex flex-col flex-grow z-10 -mt-10">
      {/* INVOICE INFO */}
      <div className="flex justify-between items-start mb-16">
        <div className="space-y-2">
          <p className="text-lg font-bold text-slate-500 uppercase tracking-widest">Facturar A:</p>
          <h2 className="text-4xl font-black uppercase text-slate-900">{receipt.clientName}</h2>
          <div className="mt-4 text-slate-600 text-lg">
            <p>Cliente Oficial</p>
            {receipt.notes && <p className="max-w-md mt-2 italic">Ref: {receipt.notes}</p>}
          </div>
        </div>
        
        <div className="text-right">
          <h1 className="text-6xl font-black uppercase tracking-widest text-primary mb-6">INVOICE</h1>
          <table className="ml-auto text-lg">
            <tbody>
              <tr>
                <td className="pr-4 font-bold text-slate-500 py-1">Número:</td>
                <td className="font-black text-slate-900">{receipt.receiptNumber}</td>
              </tr>
              <tr>
                <td className="pr-4 font-bold text-slate-500 py-1">Fecha:</td>
                <td className="font-black text-slate-900">{new Date(receipt.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}</td>
              </tr>
              <tr>
                <td className="pr-4 font-bold text-slate-500 py-1">Estado:</td>
                <td className="font-black">
                  <span className={`px-4 py-1 text-sm rounded-full ${receipt.status === 'Pagado' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {receipt.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-grow">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-primary text-white">
              <th className="py-6 px-8 text-sm font-black uppercase tracking-widest w-24 text-center">N°</th>
              <th className="py-6 px-8 text-sm font-black uppercase tracking-widest">Descripción del Servicio</th>
              <th className="py-6 px-8 text-sm font-black uppercase tracking-widest text-center">Precio</th>
              <th className="py-6 px-8 text-sm font-black uppercase tracking-widest text-center">Cant.</th>
              <th className="py-6 px-8 text-sm font-black uppercase tracking-widest text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {receipt.items.map((item, idx) => (
              <tr key={item.id} className={idx % 2 === 0 ? 'bg-primary/5' : 'bg-white'}>
                <td className="py-8 px-8 text-center text-xl font-bold text-slate-500">{idx + 1}</td>
                <td className="py-8 px-8 text-xl font-black text-slate-800">{item.description}</td>
                <td className="py-8 px-8 text-center text-xl font-bold text-slate-600">{receipt.currency === 'USD' ? '$' : '₡'}{item.price.toLocaleString()}</td>
                <td className="py-8 px-8 text-center text-xl font-bold text-slate-600">{item.quantity}</td>
                <td className="py-8 px-8 text-right text-xl font-black text-slate-900">{receipt.currency === 'USD' ? '$' : '₡'}{item.total.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTALS AND FOOTER */}
        <div className="flex justify-between items-start mt-8">
          {/* TERMS AND PAYMENT */}
          <div className="w-[600px] space-y-10 mt-10">
            <div>
               <p className="text-xl font-black text-slate-900 mb-2">Términos y Condiciones</p>
               <p className="text-slate-500 text-lg leading-relaxed">Este documento representa un comprobante de servicio. Los pagos realizados son definitivos. El servicio continuará según el acuerdo operativo firmado.</p>
            </div>
            <div>
               <p className="text-xl font-black text-slate-900 mb-2">Información de Pago</p>
               <div className="text-slate-500 text-lg space-y-1">
                 <p><span className="font-bold">Abonado a la Fecha:</span> {receipt.currency === 'USD' ? '$' : '₡'}{receipt.amountPaid.toLocaleString()}</p>
                 <p><span className="font-bold">Moneda Base:</span> {receipt.currency}</p>
                 {receipt.balancePending > 0 && (
                   <p className="text-rose-500 font-bold mt-2">Atención: Este recibo refleja un saldo pendiente.</p>
                 )}
               </div>
            </div>
          </div>

          {/* TOTALS BOX */}
          <div className="w-[450px]">
            <div className="bg-primary/5 p-8 flex justify-between items-center text-2xl font-bold text-slate-600">
               <span>SUBTOTAL</span>
               <span>{receipt.currency === 'USD' ? '$' : '₡'}{receipt.subtotal.toLocaleString()}</span>
            </div>
            <div className="bg-primary/10 p-8 flex justify-between items-center text-2xl font-bold text-slate-600">
               <span>IMPUESTOS (0%)</span>
               <span>{receipt.currency === 'USD' ? '$' : '₡'}0</span>
            </div>
            <div className="bg-primary p-10 flex justify-between items-center text-4xl font-black text-white shadow-xl">
               <span>TOTAL</span>
               <span>{receipt.currency === 'USD' ? '$' : '₡'}{receipt.total.toLocaleString()}</span>
            </div>
            {receipt.balancePending > 0 && (
              <div className="bg-rose-500 p-8 mt-4 flex justify-between items-center text-2xl font-black text-white shadow-xl">
                <span>SALDO PENDIENTE</span>
                <span>{receipt.currency === 'USD' ? '$' : '₡'}{receipt.balancePending.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* BRANDING BOTTOM */}
      <div className="mt-20 pt-8 border-t-2 border-slate-200 text-center text-slate-400 font-bold text-lg uppercase tracking-widest">
         Generado a través del Sistema Operativo Visual Oscart
      </div>
    </div>
  </div>
</div>
);
