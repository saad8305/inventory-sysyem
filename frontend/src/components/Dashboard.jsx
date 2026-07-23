import {useCallback,useEffect,useState} from 'react';
import { Link } from 'react-router-dom';
import {getProducts,createProduct,updateProduct,deleteProduct,getWarehouses,createWarehouse,deleteWarehouse,getCategories,createCategory,deleteCategory,getStocks,getTransactions,createTransaction} from '../services/api';
import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid,Cell } from 'recharts'; 
import * as XLSX from 'xlsx';
import {LayoutDashboard,Settings,PackagePlus,Warehouse,FolderPlus,ArrowRightLeft,FileSpreadsheet,Search,Edit3,Trash2,CheckCircle2,TrendingUp,DollarSign,ArrowDownLeft,ArrowUpRight,LogOut,User2Icon} from 'lucide-react';
import toast from 'react-hot-toast';
import styles from '../styles/App.module.css';
import LoginPage from './LoginPage';
import axios from 'axios';
import DatePicker from "react-multi-date-picker";
import {DateObject} from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/colors/red.css";
import gregorian from "react-date-object/calendars/gregorian";
import gregorian_en from "react-date-object/locales/gregorian_en";

function App(){
  const [token,setToken]=useState(null);
  const [isAuthLoading,setIsAuthLoading]=useState(true);
  //transfer state
  const [selectedTransferProduct,setSelectedTransferProduct]=useState('');
  const [currentStock,setCurrentStock]=useState(null);
  const [productSearch,setProductSearch]=useState('');
  
  const COLORS=['#2563eb','#16a34a','#d97706','#dc2626','#9333ea','#06b6d4','#db2777'];
  //products and ... state
  const [products,setProducts]=useState([]);
  const [warehouses,setWarehouses]=useState([]);
  const [categories,setCategories]=useState([]);
  const [stocks,setStocks]=useState([]);
  const [transactions,setTransactions]=useState([]);
  const [loading,setLoading]=useState(true);
  const [activeTab, setActiveTab]=useState('dashboard');
  const [isSubmittingTx,setIsSubmittingTx]=useState(false);
  //tarakonesh state
  const [selectedProduct,setSelectedProduct]=useState('');
  const [selectedWarehouse,setSelectedWarehouse]=useState('');
  const [quantity,setQuantity]=useState('');
  const [txType,setTxType]=useState('IN');
  //tarakonesh history filter
  const [txSearch,setTxSearch]=useState('');
  const [txFilterType,setTxFilterType]=useState('ALL');
  //management products state
  const [editingProductId,setEditingProductId]=useState(null);
  const [newProdName,setNewProdName]=useState('');
  const [newProdSku,setNewProdSku]=useState('');
  const [newProdCode,setNewProdCode]=useState('');
  const [newBuyPrice,setNewBuyPrice]=useState('');
  const [newSellPrice,setNewSellPrice]=useState('');
  const [newProdCat,setNewProdCat]=useState('');
  //warehouse state
  const [newWhName,setNewWhName]=useState('');
  const [newWhLocation,setNewWhLocation]=useState('');
  //categories state
  const [newCatName,setNewCatName]=useState('');
  const [searchTerm,setSearchTerm]=useState('');
  const [alertSearch,setAlertSearch]=useState("");
  //transfering state
  const [fromWh,setFromWh]=useState('');
  const [toWh,setToWh]=useState('');
  const [transferQty,setTransferQty]=useState('');
  const [isTransferring,setIsTransferring]=useState(false);
  //date state
  const [selectedDate,setSelectedDate]=useState(null);
  //product quantity reminder state
const MIN_STOCK_THRESHOLD=11;
const lowStockProducts=stocks.filter(stock=>stock.quantity<MIN_STOCK_THRESHOLD);
const filteredAlerts=lowStockProducts.filter(item=>{
  const pName=(item.product_name || "").toLowerCase();
  const wName=(item.warehouse_name || "").toLowerCase();
  const searchTerm=(alertSearch || "").toLowerCase();
  return pName.includes(searchTerm) || wName.includes(searchTerm);
});
//product filter for searching 
const filteredProductsForSelect=products.filter(p => 
  (p.name || "").toLowerCase().includes(productSearch.toLowerCase()) || 
  (p.sku || "").toLowerCase().includes(productSearch.toLowerCase())
);
  //check token in the first loading
  useEffect(()=>{
    try{
      const savedToken=localStorage.getItem('access_token');
      if (savedToken){setToken(savedToken);}
    } catch (error){
      console.error('Error reading from localStorage:',error);
    } finally{
      setIsAuthLoading(false);
    }
  },[]);
  //login & logout handlers
  const handleLoginSuccess=(newToken)=>{
    try{
      localStorage.setItem('access_token',newToken);
      setToken(newToken);
      toast.withToken && toast.success('ورود با موفقیت انجام شد!');
    }catch(error){
      console.error('Error saving to local storage:',error);
    }
  };

  const handleLogout=()=>{
    try{
      localStorage.removeItem('access_token');
      setToken(null);
      toast.success('از حساب کاربری خارج شدید.');
    } catch(error){
      console.error('Error removing from local storage:',error);
    }
  };

  const fetchData=useCallback(async()=>{
    try{
      setLoading(true);
      const[prodRes,whRes,catRes,stockRes,txRes]=await Promise.all([
        getProducts(),getWarehouses(),getCategories(),getStocks(),getTransactions()
      ]);
      setProducts(prodRes.data);
      setWarehouses(whRes.data);
      setCategories(catRes.data);
      setStocks(stockRes.data);
      setTransactions(txRes.data);
    }catch(error){
      if(error.response?.status===401){
        setToken(null);
        localStorage.removeItem('access_token');
      }
      toast.error("خظا در دریافت اطلاعات!!");
    }finally{
      setLoading(false);
    }
  },[]);

  useEffect(()=>{
    if(token){
      fetchData();
    }
  },[token,fetchData]);
  //transactions handlers
  const handleSubmitTransaction=async(e)=>{
    e.preventDefault();
    if (!selectedProduct || !selectedWarehouse || !quantity){
      toast.error('لطفاً تمام فیلدها را پر کنید!');
      return;
    }
    setIsSubmittingTx(true);
    const payload={
      product: parseInt(selectedProduct),
      source_warehouse:txType==='OUT'?parseInt(selectedWarehouse):null,
      destination_warehouse:txType==='IN'?parseInt(selectedWarehouse):null,
      quantity:parseInt(quantity),
      transaction_type:txType,
      description:"ثبت از طریق پنل وب"
    };
    createTransaction(payload)
      .then(()=>{
        toast.success('تراکنش با موفقیت ثبت شد!');
        setQuantity('');
        fetchData();
      })
      .catch(()=>{
        toast.error('خطا در ثبت تراکنش. موجودی انبار کافی نیست یا ورودی نامعتبر است.');
      });
      setIsSubmittingTx(false);
  };
  //updating stocks
const updateCurrentStock=(productId,warehouseId)=>{
  if(productId && warehouseId){
    const stock=stocks.find(s=>s.product===parseInt(productId) && s.warehouse===parseInt(warehouseId));
    setCurrentStock(stock?stock.quantity:0);
  }else{
    setCurrentStock(null);
  }
};

const handleSaveProduct=(e)=>{
    e.preventDefault();
    if(!newProdName || !newProdSku || !newProdCat || !newProdCode || !newBuyPrice || !newSellPrice){
      toast.error('لطفاً تمام فیلدها را پر کنید!');
      return;
    }
    setIsSubmittingTx(true);
    const payload={ 
      name:newProdName, 
      sku:newProdSku,
      product_code:newProdCode,
      buy_price:parseFloat(newBuyPrice),
      sell_price:parseFloat(newSellPrice),
      category:parseInt(newProdCat)
    };
    const request=editingProductId 
      ? updateProduct(editingProductId,payload)
      : createProduct(payload);
    request
      .then(()=>{
        toast.success(editingProductId ? 'کالا با موفقیت ویرایش شد!' : 'کالا با موفقیت اضافه شد!');
        resetProductForm();
        fetchData();
      })
      .catch((error)=>{
        console.error("خطای سرور:",error.response?.data);
        if(error.response?.data){
          toast.error(JSON.stringify(error.response.data));
        }else{
          toast.error('خطا در ذخیره کالا!');
        }
        setIsSubmittingTx(false);
      });
  };

  const handleEditProductClick=(product)=>{
    setEditingProductId(product.id);
    setNewProdName(product.name || '');
    setNewProdSku(product.sku || '');
    setNewProdCode(product.product_code ?? '');
    setNewBuyPrice(product.buy_price ?? '');
    setNewSellPrice(product.sell_price ?? '');
    setNewProdCat(product.category ?? '');
    toast('در حال ویرایش کالا...',{icon:'✏️'});
  };

  const resetProductForm=()=>{
    setEditingProductId(null);
    setNewProdName('');
    setNewProdSku('');
    setNewProdCode('');
    setNewBuyPrice('');
    setNewSellPrice('');
    setNewProdCat('');
  };

  const handleDeleteProduct=(id)=>{
    if(window.confirm('آیا از حذف این کالا اطمینان دارید؟')){
      deleteProduct(id)
        .then(()=>{
          toast.success('کالا با موفقیت حذف شد.');
          fetchData();
        })
        .catch(()=>toast.error('خطا در حذف کالا'));
    }
  };

  const handleCreateWarehouse=(e)=>{
    e.preventDefault();
    if(!newWhName){
      toast.error('نام انبار الزامی است.');
      return;
    }
    createWarehouse({name:newWhName,location:newWhLocation})
      .then(()=>{
        toast.success('انبار با موفقیت اضافه شد!');
        setNewWhName('');
        setNewWhLocation('');
        fetchData();
      })
      .catch(()=>toast.error('خطا در ایجاد انبار.'));
  };

  const handleDeleteWarehouse=(id)=>{
    if(window.confirm('آیا از حذف این انبار اطمینان دارید؟')){
      deleteWarehouse(id)
        .then(()=>{
          toast.success('انبار حذف شد.');
          fetchData();
        })
        .catch(()=>toast.error('خطا در حذف انبار'));
    }
  };
  //print transfers handlers
  const handlePrintAllTransfers = () => {
  const dataToPrint = transactions.filter(t => {
    if (t.transaction_type !== 'TRANSFER') return false;
    if (!selectedDate) return true;
    const selectedDateGregorian = new Date(selectedDate.toDate().toISOString());
    const txDate = new Date(t.created_at);
    
    return txDate.getFullYear() === selectedDateGregorian.getFullYear() &&
           txDate.getMonth() === selectedDateGregorian.getMonth() &&
           txDate.getDate() === selectedDateGregorian.getDate();
  });

  if (dataToPrint.length === 0) {
    alert("هیچ جابه‌جایی برای چاپ یافت نشد.");
    return;
  }
  const printWindow = window.open('', '_blank');
  const displayDate = selectedDate 
    ? selectedDate.convert(persian, persian_fa).format('YYYY/MM/DD') 
    : 'تمام تاریخچه';
  printWindow.document.write(`
    <html dir="rtl">
      <head>
        <style>
          body { font-family: Tahoma, Arial; padding: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #333; padding: 10px; text-align: center; }
          th { background-color: #f2f2f2; }
          .footer { margin-top: 50px; display: flex; justify-content: space-around; }
          .sign { border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 5px; }
        </style>
      </head>
      <body>
        <h2 style="text-align:center">گزارش جابه‌جایی کالاها</h2>
        <p>محدوده زمانی: ${displayDate}</p>
        <table>
          <thead>
            <tr>
              <th>کالا</th>
              <th>تعداد</th>
              <th>مبدأ</th>
              <th>مقصد</th>
              <th>تاریخ ثبت</th>
            </tr>
          </thead>
          <tbody>
            ${dataToPrint.map(tx => `
              <tr>
                <td>${tx.product_name}</td>
                <td>${tx.quantity}</td>
                <td>${tx.source_warehouse_name}</td>
                <td>${tx.destination_warehouse_name}</td>
                <td>${tx.created_at_shamsi || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <div class="sign">امضای مسئول انبار مبدأ</div>
          <div class="sign">امضای مسئول انبار مقصد</div>
        </div>
      </body>
    </html>
  `);
  
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 500);
};

  const handlePrintTransfer=(tx)=>{
  const printWindow=window.open('','_blank');
  printWindow.document.write(`
    <html dir="rtl">
      <head>
        <style>
          body { font-family: Tahoma; padding: 40px; }
          table { width: 100%; border: 1px solid #000; border-collapse: collapse; margin-top: 20px; }
          td, th { border: 1px solid #000; padding: 10px; text-align: center; }
          .sig-box { margin-top: 60px; display: flex; justify-content: space-between; }
          .sig-line { border-top: 1px solid #000; width: 500px; text-align: center; padding-top: 5px; }
        </style>
      </head>
      <body>
        <h2 style="text-align:center">رسید رسمی جابه‌جایی کالا</h2>
        <table>
          <tr><th>کالا</th><td>${tx.product_name}</td></tr>
          <tr><th>تعداد</th><td>${tx.quantity}</td></tr>
          <tr><th>انبار مبدأ</th><td>${tx.source_warehouse_name}</td></tr>
          <tr><th>انبار مقصد</th><td>${tx.destination_warehouse_name}</td></tr>
          <!-- اضافه کردن تاریخ و ساعت در اینجا -->
          <tr>
            <th>تاریخ و ساعت ثبت</th>
            <td>${tx.created_at_shamsi || '-'}</td>
          </tr>
        </table>
        <div class="sig-box">
          <div class="sig-line">امضای مسئول انبار مبدأ</div>
          <div class="sig-line">امضای مسئول انبار مقصد</div>
        </div>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <div style="margin-top:40px; text-align:center; border: 2px dashed #000; width: 150px; padding: 20px;">مهر انبار</div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
};
  //transfer handlers
  const handleTransfer=async()=>{
  const productID=parseInt(selectedTransferProduct);
  const sourceID=parseInt(fromWh);
  const destID=parseInt(toWh);
  const qty=parseInt(transferQty);
  if(!selectedTransferProduct || isNaN(productID)){
    console.error("Error: Invalid Product ID");
    return toast.error('لطفاً یک کالای معتبر انتخاب کنید.');
  }
  if(!fromWh || !toWh || sourceID === destID){
    return toast.error('انبار مبدأ و مقصد باید متفاوت و انتخاب شده باشند.');
  }
  if(isNaN(qty) || qty<=0){
    return toast.error('مقدار باید یک عدد مثبت باشد.');
  }
  setIsTransferring(true);
  const payload={
    product:productID,
    source_warehouse:sourceID,
    destination_warehouse:destID,
    quantity:qty,
    transaction_type:'TRANSFER',
    description:`انتقال از انبار ${fromWh} به انبار ${toWh}`
  };
  console.log("Payload to be sent:", JSON.stringify(payload));
  try{
    const response=await createTransaction(payload);
    console.log("Server Response:",response.data);
    toast.success('انتقال با موفقیت انجام شد');
    setSelectedTransferProduct('');
    setFromWh('');
    setToWh('');
    setTransferQty('');
    fetchData();
  }catch(error){
    console.error("Server Error Response:",error.response?.data);
    const errorMessage = error.response?.data?.product 
      ? `خطا در کالا: ${error.response.data.product}` 
      : 'خطا در ثبت انتقال.';
    toast.error(errorMessage);
  } finally{
    setIsTransferring(false);
  }
};
  //uptions handlers
  const handleCreateCategory=(e)=>{
    e.preventDefault();
    if(!newCatName){
      toast.error('نام دسته‌بندی الزامی است.');
      return;
    }
    createCategory({name:newCatName})
      .then(()=>{
        toast.success('دسته‌بندی با موفقیت اضافه شد!');
        setNewCatName('');
        fetchData();
      })
      .catch(()=>toast.error('خطا در ایجاد دسته‌بندی.'));
  };
  //print handler
  const handlePrintReceipt=()=>{
  const printWindow=window.open('','_blank');
  let totalIN=0;
  let totalOUT=0;
  filteredTransactions.forEach(tx=>{
    const isIN=tx.transaction_type==='IN';
    const price=isIN?(tx.product_buy_price || 0):(tx.product_sell_price || 0);
    const amount=tx.quantity*price;
    if(isIN) totalIN+=amount;
    else if(tx.transaction_type==='OUT') totalOUT+=amount;
  });
  const today=new DateObject({calendar:persian,locale:persian_fa}).format('YYYY/MM/DD');
  const htmlContent=`
    <html>
      <head>
        <title>رسید رسمی تراکنش‌ها</title>
        <style>
          body { font-family: Tahoma, Arial, sans-serif; direction: rtl; padding: 20px; font-size: 13px; }
          .header { text-align: center; border-bottom: 2px solid #333; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #f2f2f2; border: 1px solid #ccc; padding: 8px; }
          td { border: 1px solid #ccc; padding: 6px; text-align: center; }
          .summary-box { margin-top: 20px; border-top: 2px solid #333; padding-top: 10px; }
          .text-green { color: green; font-weight: bold; }
          .text-red { color: red; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>گزارش جامع تراکنش‌های انبار</h2>
          <p>تاریخ تهیه گزارش: ${today}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>کالا</th>
              <th>تعداد</th>
              <th>نوع</th>
              <th>توضیحات</th>
              <th>ساعت و تاریخ ثبت</th>
              <th>مبلغ (تومان)</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTransactions.map(tx=>{
              const isIN=tx.transaction_type==='IN';
              const price=isIN?(tx.product_buy_price || 0):(tx.product_sell_price || 0);
              const amount=(tx.quantity*price);
              const txDate=new DateObject({date:tx.created_at,calendar:persian,locale:persian_fa}).format('YYYY/MM/DD');
              return `
                <tr>
                  <td>${tx.product_name}</td>
                  <td>${tx.quantity}</td>
                  <td>${isIN ? 'ورودی' : 'خروجی'}</td>
                  <td>${tx.description || '-'}</td>
                  <td>${tx.created_at_shamsi}</td>
                  <td class="${isIN ? 'text-green' : 'text-red'}">
                    ${isIN ? '↑' : '↓'} ${amount.toLocaleString()}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        <div class="summary-box">
          <p><strong>جمع کل مبالغ ورودی:</strong> <span class="text-green">${totalIN.toLocaleString()} تومان</span></p>
          <p><strong>جمع کل مبالغ خروجی:</strong> <span class="text-red">${totalOUT.toLocaleString()} تومان</span></p>
          <p><strong>تراز نهایی:</strong> ${(totalIN - totalOUT).toLocaleString()} تومان</p>
        </div>
      </body>
    </html>
  `;
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.print();
};

  const handleDeleteCategory=(id)=>{
    if(window.confirm('آیا از حذف این دسته‌بندی اطمینان دارید؟')){
      deleteCategory(id)
        .then(()=>{
          toast.success('دسته‌بندی حذف شد.');
          fetchData();
        })
        .catch(()=>toast.error('خطا در حذف دسته‌بندی'));
    }
  };
  //Excel print handler
  const exportToExcel=()=>{
  const dataToExport=stocks.map(s=>{
    const qty=Number(s.quantity) || 0;
    const price=Number(s.product_sell_price) || 0;
    return{
      "نام کالا":s.product_name,
      "نام انبار":s.warehouse_name,
      "موجودی":qty,
      "قیمت واحد":price,
      "ارزش کل":qty*price
    };
  });
    const warehouseTotals=stocks.reduce((acc,s)=>{
      acc[s.warehouse_name]=(acc[s.warehouse_name] || 0)+(s.quantity*s.product_sell_price);
      return acc;
    },{});
    const worksheet=XLSX.utils.json_to_sheet(dataToExport);
    const workbook=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook,worksheet,"موجودی انبار");
    XLSX.writeFile(workbook,"Inventory_Report.xlsx");
    toast.success('فایل اکسل با موفقیت دانلود شد!');
  };
  let totalBuyValue=0;
  let totalSellValue=0;
  stocks.forEach(stock=>{
    const product=products.find(p=>p.id===stock.product);
    if(product){
      const buyPrice=product.buy_price || 0;
      const sellPrice=product.sell_price || 0;
      totalBuyValue+=buyPrice * stock.quantity;
      totalSellValue+=sellPrice * stock.quantity;
    }
  });
  const potentialProfit=totalSellValue-totalBuyValue;
  const filteredStocks=stocks.filter(stock=>
    (stock.product_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (stock.product_sku || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (stock.warehouse_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredTransactions = transactions.filter(tx => {
    const isFinancial=tx.transaction_type==='IN' || tx.transaction_type==='OUT';
    let matchesType=txFilterType==='ALL'?isFinancial:tx.transaction_type===txFilterType;
    const productName=tx.product_name || '';
    const description=tx.description || '';
    const matchesSearch=productName.toLowerCase().includes(txSearch.toLowerCase()) ||
                          description.toLowerCase().includes(txSearch.toLowerCase());
    
    const matchesDate = selectedDate 
        ? new DateObject(selectedDate).convert(gregorian, gregorian_en).format('YYYY/MM/DD') === 
          new DateObject({ date: tx.created_at, calendar: gregorian, locale: gregorian_en }).format('YYYY/MM/DD')
        : true;
    return matchesType && matchesSearch && matchesDate;
});
  const chartData=stocks.map(s=>({
    name:`${s.product_name} (${s.warehouse_name})`,
    موجودی:s.quantity
  }));
  if(isAuthLoading){
    return(
      <div className={styles.container}>
        <div className={styles.card}>
          <p className={styles.loading}>در حال بررسی وضعیت احراز هویت...</p>
        </div>
      </div>
    );
  }
  if(!token){
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }
  if(loading){
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <p className={styles.loading}>در حال بارگذاری اطلاعات...</p>
        </div>
      </div>
    );
  }
  //all transfers for first list
const filteredTransfers = transactions.filter(t => {
  const isTransfer = t.transaction_type === 'TRANSFER';
  if (!isTransfer) return false;
  if (!selectedDate) return true;
  const txDate = new Date(t.created_at); 
  const txYear = txDate.getFullYear();
  const txMonth = txDate.getMonth();
  const txDay = txDate.getDate();
  const selectedDateGregorian = new Date(selectedDate.toDate().toISOString());
  const selYear = selectedDateGregorian.getFullYear();
  const selMonth = selectedDateGregorian.getMonth();
  const selDay = selectedDateGregorian.getDate();

  return txYear === selYear && txMonth === selMonth && txDay === selDay;
});
const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    try {
        return new DateObject({
            date: dateString,
            calendar: persian,
            locale: persian_fa
        }).format("YYYY/MM/DD - HH:mm");
    } catch (e) {
        return "تاریخ نامعتبر";
    } 
};
//========================================================================================================
  return(
    <div className={styles.container}>
      <div className={styles.card} style={{maxWidth:'1100px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
          <div>
            <nav>
              <Link to="/settings" className={styles.profileContainer}>
                <span className={styles.profileText}><User2Icon size={16}/> تنظیمات پروفایل</span>
              </Link>
            </nav>
          </div>
          <h1 className={styles.title} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',margin:0}}>
            <Warehouse size={32} color="#2563eb"/> داشبورد مدیریت انبار
          </h1>
          <button 
            onClick={handleLogout} 
            style={{background:'#dc2626',color:'#fff',border:'none',padding:'8px 12px',borderRadius:'6px',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:'6px',fontSize:'0.9rem'}}
          >
            <LogOut size={16}/> خروج
          </button>
        </div>
        <hr/>
        <br/>
        {lowStockProducts.length>0 && (
            <div className={styles.alertCard}>
                <h3 className={styles.alertTitle}>
                    <span role="img" aria-label="alert">⚠️</span> توجه: موجودی انبار کم است
                </h3>
                <input type="text" placeholder="جستجو در انبارها..." className={styles.searchBox} style={{marginBottom:'10px'}} onChange={(e)=>setAlertSearch(e.target.value)}/>
                <ul className={styles.alertList}>
                    {filteredAlerts.map(item=>(
                        <li key={item.id} className={styles.alertItem}>
                          <div style={{display:'flex',flexDirection:'column'}}>
                            <span style={{ fontWeight: 'bold' }}>{item.product_name}</span>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              محل:                 {item.warehouse_name}
                            </span>
                          </div>
                          <span style={{color:item.quantity===0?'#dc2626':'#d97706',fontWeight:'bold',background: '#fff',padding: '4px 8px',borderRadius: '6px'}}>
                            {item.quantity===0?'موجود نیست !':`${item.quantity}عدد`}
                          </span>
                        </li>
                    ))}
                </ul>
                </div>
              )}
        <br/>
        <hr/>
        <br/>
        <div className={styles.tabsContainer}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'dashboard' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('dashboard')}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <LayoutDashboard size={18} /> داشبورد و موجودی انبار
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'management' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('management')}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Settings size={18} /> ثبت و مدیریت اطلاعات پایه
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <>
            <div className={styles.dashboardGrid}>
              <div className={styles.statCard} style={{border:'1px solid rgba(20, 181, 52, 1)' }}>
                <div className={styles.statTitle} style={{ display: 'flex', alignItems: 'center', gap: '6px',color:'green'}}><PackagePlus size={16} /> تعداد کالاها</div>
                <div className={styles.statValue}>{products.length}</div>
              </div>
              <div className={styles.statCard} style={{border:'1px solid rgba(248, 0, 0, 1)' }}>
                <div className={styles.statTitle} style={{ display: 'flex', alignItems: 'center', gap: '6px',color:'red' }}><Warehouse size={16} /> تعداد انبارها</div>
                <div className={styles.statValue}>{warehouses.length}</div>
              </div>
              <div className={styles.statCard} style={{border:'1px solid rgba(17, 0, 255, 1)' }}>
                <div className={styles.statTitle} style={{ display: 'flex', alignItems: 'center', gap: '6px',color:'blue' }}><FolderPlus size={16} /> دسته‌بندی‌ها</div>
                <div className={styles.statValue}>{categories.length}</div>
              </div>
              <div className={styles.statCard} style={{border:'1px solid #cc0fc2ff' }}>
                <div className={styles.statTitle} style={{ display: 'flex', alignItems: 'center', gap: '6px',color:'#cc0fc2ff' }}><ArrowRightLeft size={16} /> رکوردهای موجودی</div>
                <div className={styles.statValue}>{stocks.length}</div>
              </div>
            </div>
            <div className={styles.dashboardGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginTop: '1rem' }}>
              <div className={styles.statCard} style={{ background: '#f8fafc', borderLeft: '9px solid #2563eb',borderRight:'9px solid #2563eb' }}>
                <div className={styles.statTitle} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><DollarSign size={16} /> ارزش کل خرید انبار</div>
                <div className={styles.statValue} style={{ fontSize: '1.2rem', color: '#2563eb' }}>
                  {totalBuyValue.toLocaleString()} <span style={{ fontSize: '0.9rem',color:'#2563eb' }}>تومان</span>
                </div>
              </div>
              <div className={styles.statCard} style={{ background: '#f8fafc', borderLeft: '9px solid #16a34a',borderRight:'9px solid #16a34a' }}>
                <div className={styles.statTitle} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><DollarSign size={16} /> ارزش کل فروش انبار</div>
                <div className={styles.statValue} style={{ fontSize: '1.2rem',color:'#16a34a' }}>
                  {totalSellValue.toLocaleString()} <span style={{ fontSize: '0.9rem' }}>تومان</span>
                </div>
              </div>
              <div className={styles.statCard} style={{ background: '#f8fafc', borderLeft: '9px solid #9333ea',borderRight:'9px solid #9333ea' }}>
                <div className={styles.statTitle} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><TrendingUp size={16} />سود فروش</div>
                <div className={styles.statValue} style={{ fontSize: '1.2rem', color: '#9333ea' }}>
                  {potentialProfit.toLocaleString()} <span style={{ fontSize: '0.9rem' }}>تومان</span>
                </div>
              </div>
            </div>
            <hr/>
            <br/>
            <div className={styles.formSection}>
              <h2 className={styles.subTitle} style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowRightLeft size={20} /> ثبت تراکنش جدید (ورود/خروج)
              </h2>
              <form onSubmit={handleSubmitTransaction}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>نوع تراکنش</label>
                    <select className={styles.select} value={txType} onChange={(e) => setTxType(e.target.value)}>
                      <option value="IN">ورودی (خرید/اضافه به انبار)</option>
                      <option value="OUT">خروجی (فروش/کسر از انبار)</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>انتخاب کالا</label>
                    <select className={styles.select} value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}>
                      <option value="">انتخاب کنید...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>انتخاب انبار</label>
                    <select className={styles.select} value={selectedWarehouse} onChange={(e) => setSelectedWarehouse(e.target.value)}>
                      <option value="">انتخاب کنید...</option>
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>تعداد</label>
                    <input 
                      type="number" 
                      className={styles.input} 
                      value={quantity} 
                      onChange={(e) => setQuantity(e.target.value)} 
                      placeholder="مثلاً 10" 
                      min="1"
                    />
                  </div>
                </div>

                <button type="submit" className={styles.button} disabled={isSubmittingTx} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    {isSubmittingTx}
                  <ArrowRightLeft size={16} /> ثبت تراکنش
                </button>
              </form>
            </div>
            
            <h2 className={styles.subTitle}>تاریخچه تراکنش‌ها</h2>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={18} color="#0044ffff" style={{ position: 'absolute', right: '12px', top: '14px' }} />
              <input 
                type="text" 
                className={styles.searchBox} 
                style={{ width: '100%', margin: 0, paddingRight: '38px' }}
                placeholder="جستجو در نام کالا یا توضیحات..." 
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
              />
            </div>

            
            <select className={styles.select} style={{ width: '150px', margin: 0 }} value={txFilterType} onChange={(e) => setTxFilterType(e.target.value)}>
              <option value="ALL">همه تراکنش‌ها</option>
              <option value="IN">فقط ورودی‌ها</option>
              <option value="OUT">فقط خروجی‌ها</option>
            </select>

            
            <div style={{ width: '180px' }}>
              <DatePicker.default
                value={selectedDate}
                onChange={setSelectedDate}
                placeholder="انتخاب تاریخ"
                calendar={persian}
                locale={persian_fa}
                inputClass  ={styles.input}
                
              />
            </div>

            <button 
              onClick={handlePrintReceipt} 
              className={styles.button} 
              style={{ background: '#2563eb', margin: 0, padding: '10px 15px' }}
            >
              چاپ لیست
            </button>
          </div>

            {filteredTransactions.length === 0 ? (
              <p className={styles.emptyText}>هیچ تراکنشی با این مشخصات یافت نشد.</p>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>نوع</th>
                      <th>کالا</th>
                      <th>تعداد</th>
                      <th>توضیحات</th>
                      <th>ساعت و تاریخ ثبت</th>
                      <th>مبلغ ورودی/خروجی</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.slice(-15).reverse().map(tx => (
                      <tr key={tx.id}>
                        <td>
                          <span style={{ color: tx.transaction_type === 'IN' ? '#16a34a' : '#dc2626', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {tx.transaction_type === 'IN' ? <><ArrowDownLeft size={16} /> ورودی</> : <><ArrowUpRight size={16} /> خروجی</>}
                          </span>
                        </td>
                        <td>{tx.product_name || `کد: ${tx.product}`}</td>
                        <td><strong>{tx.quantity}</strong></td>
                        <td>{tx.description || 'بدون توضیحات'}</td>
                        <td>{tx.created_at_shamsi}</td>                      
                        <td style={{fontWeight:'bold'}}>
                          {tx.transaction_type==='IN' ? (
                            <span style={{color:'green'}}>
                              ↑ { (tx.quantity * tx.product_buy_price).toLocaleString()} تومان
                            </span>
                          
                          ): tx.transaction_type==='OUT' ? (
                            <span style={{color:'red'}}>
                              ↓ { (tx.quantity * tx.product_sell_price).toLocaleString()} تومان
                            </span>
                          ) : (
                            <span>-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        <hr/>
        <br/>
      
            <div className={styles.formSection} style={{ border: '2px dashed #f59e0b' }}>
              <h2 className={styles.subTitle} style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309' }}>
                <ArrowRightLeft size={20} />جابه‌جایی بین انبارها
              </h2>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  
                  <label className={styles.label}>جستجو و انتخاب کالا</label>
                  <input 
                    type="text" 
                    className={styles.input} 
                    placeholder="نام کالا را تایپ کنید..." 
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    style={{ marginBottom: '5px' }}
                  />
                  <select className={styles.select} value={selectedTransferProduct} onChange={(e) => setSelectedTransferProduct(e.target.value)}>
                    <option value="">یک کالا انتخاب کنید...{filteredProductsForSelect.length}</option>
                    {filteredProductsForSelect.map(p=>(
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  
                  <label className={styles.label}>مبدأ</label>
                  <select className={styles.select} value={fromWh} onChange={(e) =>{
                    setFromWh(e.target.value);
                    updateCurrentStock(selectedTransferProduct,e.target.value);
                    }}>
                    <option value="">انتخاب انبار مبدأ...</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                  {currentStock !== null && (<p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '5px' }}>
      موجودی فعلی در این انبار:            <strong>{currentStock} عدد</strong>
                  </p>
                    )}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>مقصد</label>
                  <select className={styles.select} value={toWh} onChange={(e) => setToWh(e.target.value)}>
                    <option value="">انتخاب انبار مقصد...</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.formGroup} style={{ marginTop: '10px' }}>
                <input 
                  type="number" className={styles.input} placeholder="تعداد برای انتقال" 
                  value={transferQty} onChange={(e) => setTransferQty(e.target.value)} 
                />
              </div>
              <button 
                className={styles.button} 
                onClick={async () => {
                   if(fromWh === toWh) return toast.error('مبدأ و مقصد یکی هستند!');
                   setIsTransferring(true);
                   try {
                     await createTransaction({
                        product: parseInt(selectedTransferProduct),
                        source_warehouse: parseInt(fromWh),
                        destination_warehouse: parseInt(toWh),
                        quantity: parseInt(transferQty),
                        transaction_type: 'TRANSFER',
                        description: `انتقال از ${fromWh} به ${toWh}`
                     });
                     toast.success('انتقال با موفقیت انجام شد');
                     fetchData();
                   } catch { toast.error('خطا در انتقال'); }
                   finally { setIsTransferring(false); }
                }}
                disabled={isTransferring || !fromWh || !toWh || !transferQty}
                style={{ background: '#f59e0b', marginTop: '10px' }}
              >
                {isTransferring ? 'در حال انتقال...' : 'ثبت جابه‌جایی'}
              </button>
            </div>            
            <div style={{ 
              display: 'flex', 
              gap: '15px', 
              alignItems: 'center', 
              marginTop: '2rem', 
              marginBottom: '1rem',
              background: '#f9fafb',
              padding: '15px',
              borderRadius: '8px'
            }}>
            <h2 className={styles.subTitle}>تاریخچه جابه‌جایی بین انبارها</h2>            
            <div style={{ flexGrow: 1, maxWidth: '200px' }}>
              <DatePicker.default
                value={selectedDate}
                onChange={(date)=>{
                  console.log('تاریخ انتخاب شده : ',date);
                  setSelectedDate(date);
                }}
                placeholder="فیلتر تاریخ"
                calendar={persian}
                locale={persian_fa}
                inputClass={styles.datePickerInput}
              />
            </div>
            <button 
              onClick={handlePrintAllTransfers} 
              className={styles.button} 
              style={{ background: selectedDate?'#059669':'#6b7280', padding: '8px 16px',color:'white',border:'none',borderRadius:'4px',cursor:'pointer'}}
            >
              {selectedDate 
                ? `چاپ جابه‌جایی‌های تاریخ ${new DateObject(selectedDate).format('YYYY/MM/DD')}` 
                : "چاپ کل تاریخچه جابه‌جایی‌ها"}
            </button>
          </div>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>کالا</th>
                    <th>تعداد</th>
                    <th>مبدأ</th>
                    <th>مقصد</th>
                    <th>ساعت و تاریخ ثبت</th>
                    <th>چاپ رسید</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransfers.reverse().map(tx => (
                    <tr key={tx.id}>
                      <td>{tx.product_name}</td>
                      <td>{tx.quantity}</td>
                      <td>{tx.source_warehouse_name}</td>
                      <td>{tx.destination_warehouse_name}</td>
                      <td>{tx.created_at_shamsi}</td>
                      <td>
                        <button onClick={() => handlePrintTransfer(tx)} className={styles.button} style={{padding: '4px 8px'}}>چاپ رسید</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>            
            <hr/>
            <br/>
            {stocks.length > 0 && (
              <div className={styles.chartContainer}>
                <h2 className={styles.subTitle} style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={20} /> نمودار میزان موجودی کالاها
                </h2>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="موجودی" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            <hr/>
            <br/>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <h2 className={styles.subTitle} style={{ borderBottom: 'none', margin: 0 }}>وضعیت موجودی انبارها</h2>
            </div>

            <div style={{ position: 'relative' }}>
              <Search size={18} color="#94a3b8" style={{ position: 'absolute', right: '12px', top: '22px' }} />
              <input 
                type="text" 
                className={styles.searchBox} 
                style={{ paddingRight: '38px' }}
                placeholder="جستجو بر اساس نام کالا، کد یکتا یا نام انبار..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={exportToExcel} className={styles.exportButton} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FileSpreadsheet size={18} /> دانلود خروجی اکسل (Excel)
              </button>
            {filteredStocks.length === 0 ? (
              <p className={styles.emptyText}>هیچ کالایی یافت نشد.</p>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>نام کالا</th>
                      <th>کد یکتا</th>
                      <th>نام انبار</th>
                      <th>موجودی فعلی</th>
                      <th>قیمت واحد</th>
                      <th>قیمت کل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStocks.map(stock=>{
                      const qty = Number(stock.quantity) || 0;
                      const price = Number(stock.product_sell_price) || 0;
                      const totalValue = qty * price;
                      return(
                        <tr key={stock.id}>
                          <td>{stock.product_name}</td>
                          <td>{stock.product_sku}</td>
                          <td>{stock.warehouse_name}</td>
                          <td><strong>{qty}</strong></td>
                          <td>{stock.product_sell_price ? stock.product_sell_price.toLocaleString() : '۰'} تومان</td>
                          <td style={{ fontWeight: 'bold' }}>
                            {((Number(stock.quantity) || 0) * (Number(stock.product_sell_price) || 0)).toLocaleString()} تومان
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}


        {activeTab === 'management' && (
          <div>
            <div className={styles.subGrid}>
              <div className={styles.formSection} style={{ margin: 0 }}>
                <h3 className={styles.subTitle} style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <PackagePlus size={18} /> {editingProductId ? 'ویرایش کالا' : 'افزودن کالای جدید'}
                </h3>
                <form onSubmit={handleSaveProduct}>
                  <div className={styles.formGroup} style={{ marginBottom: '0.8rem' }}>
                    <label className={styles.label}>نام کالا</label>
                    <input type="text" className={styles.input} value={newProdName} onChange={(e) => setNewProdName(e.target.value)} placeholder="نام کالا را وارد کنید" />
                  </div>
                  <div className={styles.formGroup} style={{ marginBottom: '0.8rem' }}>
                    <label className={styles.label}>کد یکتا</label>
                    <input type="text" className={styles.input} value={newProdSku} onChange={(e) => setNewProdSku(e.target.value)} placeholder="کد یکتا برای کالا وارد کنید" />
                  </div>
                  <div className={styles.formGroup} style={{ marginBottom: '0.8rem' }}>
                    <label className={styles.label}>کد محصول</label>
                    <input type="text" className={styles.input} value={newProdCode} onChange={(e) => setNewProdCode(e.target.value)} placeholder="برای مثال 100" />
                  </div>
                  <div className={styles.formGroup} style={{ marginBottom: '0.8rem' }}>
                    <label className={styles.label}>قیمت خرید</label>
                    <input type="number" className={styles.input} value={newBuyPrice} onChange={(e) => setNewBuyPrice(e.target.value)} placeholder="مثلاً 50000" />
                  </div>
                  <div className={styles.formGroup} style={{ marginBottom: '0.8rem' }}>
                    <label className={styles.label}>قیمت فروش</label>
                    <input type="number" className={styles.input} value={newSellPrice} onChange={(e) => setNewSellPrice(e.target.value)} placeholder="مثلاً 70000" />
                  </div>
                  <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
                    <label className={styles.label}>دسته‌بندی</label>
                    <select className={styles.select} value={newProdCat} onChange={(e) => setNewProdCat(e.target.value)}>
                      <option value="">انتخاب دسته‌بندی...</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" disabled={isSubmittingTx} className={styles.button}>
                        {isSubmittingTx}
                      {editingProductId ? 'بروزرسانی کالا' : 'ثبت کالا'}
                    </button>
                    {editingProductId && (
                      <button type="button" onClick={resetProductForm} className={styles.button} style={{ background: '#64748b' }}>
                        انصراف
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className={styles.formSection} style={{ margin: 0 }}>
                <h3 className={styles.subTitle} style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Warehouse size={18} /> افزودن انبار جدید
                </h3>
                <form onSubmit={handleCreateWarehouse}>
                  <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
                    <label className={styles.label}>نام انبار</label>
                    <input type="text" className={styles.input} value={newWhName} onChange={(e) => setNewWhName(e.target.value)} placeholder="مثلاً انبار شرق" />
                  </div>
                  <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
                    <label className={styles.label}>آدرس/موقعیت</label>
                    <input type="text" className={styles.input} value={newWhLocation} onChange={(e) => setNewWhLocation(e.target.value)} placeholder="مثلاً تهران..." />
                  </div>
                  <button type="submit" disabled={isSubmittingTx} className={styles.button}>ثبت انبار</button>
                </form>
              </div>

              <div className={styles.formSection} style={{ margin: 0 }}>
                <h3 className={styles.subTitle} style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FolderPlus size={18} /> افزودن دسته‌بندی جدید
                </h3>
                <form onSubmit={handleCreateCategory}>
                  <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
                    <label className={styles.label}>نام دسته‌بندی</label>
                    <input type="text" className={styles.input} value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="مثلاً قطعات" />
                  </div>
                  <button type="submit" className={styles.button}>ثبت دسته‌بندی</button>
                </form>
              </div>
            </div>

            <h2 className={styles.subTitle}>لیست کالاها (مدیریت، ویرایش و حذف)</h2>
            <div className={styles.tableContainer} style={{ marginBottom: '2rem' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>شناسه</th>
                    <th>نام کالا</th>
                    <th>کد یکتا</th>
                    <th>قیمت فروش</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td><strong>{p.name}</strong></td>
                      <td>{p.sku}</td>
                      <td>{p.sell_price ? `${p.sell_price} تومان` : '-'}</td>
                      <td>
                        <button 
                          onClick={() => handleEditProductClick(p)} 
                          style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', marginLeft: '5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Edit3 size={14} /> ویرایش
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(p.id)} 
                          style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Trash2 size={14} /> حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2 className={styles.subTitle}>انبارهای فعال سیستم</h2>
            <div className={styles.tableContainer} style={{ marginBottom: '2rem' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>شناسه</th>
                    <th>نام انبار</th>
                    <th>موقعیت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouses.map(w => (
                    <tr key={w.id}>
                      <td>{w.id}</td>
                      <td><strong>{w.name}</strong></td>
                      <td>{w.location || 'ثبت نشده'}</td>
                      <td>
                        <button 
                          onClick={() => handleDeleteWarehouse(w.id)} 
                          style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Trash2 size={14} /> حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2 className={styles.subTitle}>دسته‌بندی‌های موجود</h2>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>شناسه</th>
                    <th>نام دسته‌بندی</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(c => (
                    <tr key={c.id}>
                      <td>{c.id}</td>
                      <td><strong>{c.name}</strong></td>
                      <td>
                        <button 
                          onClick={() => handleDeleteCategory(c.id)} 
                          style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Trash2 size={14} /> حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
export default App;