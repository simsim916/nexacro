/***********************************************************************
 * 01. Creation date      : 2015.08.18
 * 02. Created by         : 김성욱
 * 03. Revision history   : 
 ***********************************************************************
 */

 include "lib::common_form.xjs";
 include "si_co::si_comm_function.xjs";
 this.pvs_openretv     	= undefined;  // 파라메터로 받은 open 시 retv 여부("R" 이면 조회)  
 this.pvs_multiselect	= undefined;  // 파라메터로 받은 multi select 여부("M" 이면 multi select) 
 this.pvs_argument			= undefined;  
 this.fvs_calgbn			= undefined;  
 this.pvs_RtnArr		= undefined;  //Array declaration when close button click, making array
 this.vi_ErrorCode=undefined;     // 콜백루틴의 에러코드        싱크트란잭션일경우 사용
 var pvs_Update_sql='';		//update sql 
var ivColname;
var vToday;
var ivLevelcd, ivDeptcd,    ivInqdept, ivUserid, ivEmpno;
var ivSarea,   ivInqsarea,  ivProtect;    
var ivFrdate,  ivTodate;
var iv_SvcAct ;
/***********************************************************************
 * Event process specification
 ************************************************************************/
// Initializing on Form onload
this.form_onload = function (obj:Form, e:LoadEventInfo)
{
	this.gf_formOnload(obj);
 	this.ff_load(obj);
}

this.ff_load = function(obj)
{
	pvs_OpenParam		= new Array();  
	this.pvs_openretv    = NXCore.getParameter(obj, "OpenRetv");     // 파라메터로 받은 open 시 retv 여부 
	this.pvs_multiselect = NXCore.getParameter(obj, "MultSelect");   // 파라메터로 받은 multi select 여부 
	this.pvs_argument       = NXCore.getParameter(obj, "Argument");     // 파라메터로 받은 argument;
	
	ivUserid = application.gvs_userid;
    ivEmpno  = application.gvs_empid;	
	
    vRtn = this.gsi_get_inqauth(ivUserid);

    ivLevelcd   = vRtn[1];
    ivDeptcd    = vRtn[2];
    ivInqdept   = vRtn[3];
    ivSarea     = vRtn[4];
    ivInqsarea  = vRtn[5];
    ivProtect   = vRtn[6];
    ivLevelcd2  = vRtn[7];
    ivDeptcd2   = vRtn[8];
    ivInqdept2  = vRtn[9];
    ivSarea2    = vRtn[10];
    ivInqsarea2 = vRtn[11];
    
    var vRtn1 = this.gf_Getsyscnfg('S', 24, '11');
  
    var vRtn2 = vRtn1.split('-');
       
    ivFrdate = vRtn2[0];
    ivTodate = vRtn2[1];   
    
	this.ff_SetCondition();   // 초기 조건 파라메터 셋팅 및 콤보 셋팅
		
	if ( this.pvs_openretv == "Y")
	{
		this.btn_retrieve_onclick();  // 조회
	}
	
	if ( this.pvs_multiselect == "Y")
	{
		this.grd_list.set_selecttype("multirow");
	}
	else
	{
		this.grd_list.set_selecttype("row");
	}
	
	iv_SvcAct = "co/popu/co_popu_pack_crt_f_1q.jsp";
}
 
// 초기 조건 파라메터 셋팅 및 콤보 셋팅
this.ff_SetCondition = function()
{
	this.ds_head.addRow();
	
	this.gf_popup_btn_hide(this.div_btn,"btn_add|btn_delete");
	this.gf_popup_btn_sort(this.div_btn);
	
	if (NXCore.isEmpty(ivInqsarea) || ivInqsarea == '') 
	{
		ivInqsarea = '%';
	}
	this.gf_combo_head_sync(this.ds_head,"ARG_SAREA",this.DivHead.cbo_sarea,"co_dddw_sarea_sales5",ivInqsarea + '|' + ivInqsarea2,0);	
	
	var vSysId = application.gvs_sysid;
	if (vSysId == 'Y' || ivInqsarea == '%') 
	{	    
	    this.DivHead.chk_shpmall.set_enable(true);
	} 
	else 
	{
		this.DivHead.chk_shpmall.set_enable(false);
	}
	
	var vs_param = this.pvs_argument.split("|");
	vPoday = vs_param[0];
	
	this.ds_head.setColumn(0, "ARG_SYYMM", vPoday.substr(0,6));
	 
	this.ds_head.setColumn(0, "ARG_SALEDT", vs_param[1]);
//	this.ds_head.setColumn(0, "ARG_SAREA", ivSarea);
	this.ds_head.setColumn(0, "ARG_CHOICE", '1');
	this.ds_head.setColumn(0, "ARG_CVCHG", 'N');
	this.ds_head.setColumn(0, "ARG_GUBUN", 'Y');
	this.ds_head.setColumn(0, "ARG_SHPMALL", 'N');
	if(NXCore.isEmpty(ivInqsarea.replace(/%/gi, '')) || ivInqsarea.replace(/%/gi, '') == '')
    {
		this.ds_head.setColumn(0,"ARG_SAREA",'%');
	}
//	else		// 전체권한이 아니면 본부전체로 조회 불가하도록 한다.
//	{
//		this.ds_head.setColumn(0,"ARG_SAREA",ivInqsarea.replace(/%/gi, ''));
//	}
	
    var vShpmall = 'N';
    if (ivDeptcd == 'P1223')
    {
    	vShpmall = 'Y';
	}

	return;
}


// 조회 버튼 
this.btn_retrieve_onclick = function(obj:Button,  e:nexacro.ClickEventInfo)
{
	this.ds_list.clearData(); 
	this.ds_edit.clearData(); 
	this.ds_hist.clearData(); 
	
	var vSyymm 		= this.ds_head.getColumn(0,"ARG_SYYMM");
	var vSarea		= this.ds_head.getColumn(0,"ARG_SAREA");
	var vScvcod		= this.ds_head.getColumn(0,"ARG_SCVCOD");
	var vEcvcod		= this.ds_head.getColumn(0,"ARG_ECVCOD");
	
	/*if (NXCore.isEmpty(vScvcod) || vScvcod == '' || NXCore.isEmpty(vEcvcod) || vEcvcod == '') 
	{
		alert("거래처를 입력하세요");
		this.DivHead.ed_cvcod.setFocus();
		return;      
	}*/
	
	if (NXCore.isEmpty(vSyymm) || vSyymm == '') 
	{
		alert("기준월을 입력하세요");
		return;
	}
	
	if (NXCore.isEmpty(vSarea) || vSarea == '') 
	{
		alert(" 영업팀 선택 후 조회하세요");
	    return;
	}
		
	if (vSarea != '%' && vSarea.length == 4 && vSarea.substr(3, 1) == '0') 
	{				
		this.ds_head.setColumn(0, "ARG_SAREA_P", this.ds_head.getColumn(0,"ARG_SAREA").substr(0,3) + '%');
	}
	else
	{
		this.ds_head.setColumn(0, "ARG_SAREA_P", vSarea);
	}
	
	this.ff_Tran("SELECT");
}

// 저장버튼
this.btn_save_onclick = function(obj:Button,  e:nexacro.ClickEventInfo)
{
	if ( !NXCore.isModified(this.ds_list) )
	{
		this.gf_message_chk("291", "");  // 변경된 자료가 없습니다.
		return;
	}
	var vToday = this.gf_today();   //오늘날짜
	var vChk;
	var vResult = this.gf_SelectSql_sync("ds_Temp: SELECT MAX(CLDATE) FROM P4_CALENDAR WHERE CLDATE LIKE '"+ vToday.substr(0,6) +"'||'%' ", "SELECT_reffpf_5A", "ff_Callback_sync",0);
	
	if(vToday == vResult[1])
	{
		var vs_amt = this.ds_list.getSum("CRT_AMT") + this.ds_list.getSum("PACK_SALE");
		if(vs_amt != this.ds_list.getSum("IOAMT"))
		{
			alert('총 발행금액과 출하/반품 금액이 맞지않습니다.');
			return;
		}else if (this.ff_Savertn() == -1)
		{
			alert("팩 판매 생성을 실패하였습니다");
			return;
		}
		
	}
	else if (this.ff_Savertn() == -1)
	{
		alert("팩 판매 생성을 실패하였습니다");
		return;
	}

	

	//return;
}

this.ff_Callback_sync =  function(sSvcID, ErrorCode, ErrorMsg)
{
	vi_ErrorCode=ErrorCode;     // 콜백루틴의 에러코드        싱크트란잭션일경우 사용
	vs_ErrorMsg=ErrorMsg;      //// 콜백루틴의 에러메세지    싱크트란잭션일경우 사용
 	if (ErrorCode < 0)
 	{
 		NXCore.alert('CallBack SVCID = ' +sSvcID + '  ErrorCode = ' + ErrorCode + ' MSG = ' + ErrorMsg);
 	}
 	
 	//SELECT * FROM SALE_DAILY_CLOSE_LOG;
}

// 확인 버튼 
this.btn_confirm_onclick = function(obj:Button,  e:nexacro.ClickEventInfo)
{
	this.ff_Confirm();
}

this.btn_close_onclick = function(obj:Button,  e:nexacro.ClickEventInfo)
{
	var vIodate = this.ds_head.getColumn(0, "ARG_SYYMM");
	    
    var vSql = "UPDATE IMHIST_SAL SET YEBI4 = '', CHECKNO = '' "
					+ "  WHERE IOJPNO IN (SELECT IOJPNO FROM IMHIST_SAL A, SALEH B WHERE A.CHECKNO = B.CHECKNO(+) AND A.IO_DATE LIKE '"+vIodate+"'||'%' AND B.CHECKNO IS NULL AND A.CHECKNO IS NOT NULL) " ;
         
    this.gf_UpdateSql_sync(vSql, 'UPDATE_SQL',"ff_Callback_sync", 0);
    
	this.close("0");  // return count 0 
}

this.ff_Object_onitemchanged = function(obj:Edit, e:nexacro.ChangeEventInfo)
{
	var vs_Data;			//이벤트에서 데이터 값  
	var vs_Sql; 			//Sql의 값
	var vn_row; 			// 해당 row 값  
	
	// dataset과 다른 object로 나눠서 처리 
	// obj를 dataset를 확인 해서 처리 함.	
	if(obj == '[object Dataset]')
	{
		vn_row = e.row;
		vs_Data = e.newvalue;
		// dataset 이름 별로 처리 
		if(obj.id == 'ds_list')
		{			
			switch (e.columnid)
			{
				case 'CHK':
					if(vs_Data == '1')
					{
						this.ff_Calc(this.ds_list, vn_row, '1');
					}
					else
					{
						this.ds_list.setColumn(vn_row, "CRT_AMT",0);  
					}
					break;
					
				case 'CRT_AMT':
					this.ds_list.set_enableevent(false);
					if (parseFloat(vs_Data) != 0)
                    {
                        this.ds_list.setColumn(vn_row, "CHK",'1');
                        
                        //this.ff_Calc(this.ds_list, vn_row, '1');                        
                    }
                    else
                    {
						 this.ds_list.setColumn(vn_row, "CHK",'0');
                    }                   
                    this.ds_list.set_enableevent(true);
					break;
 									
				
			}
		}
		else if(obj.id == 'ds_edit')
		{
			switch (e.columnid)
			{
				case 'SUDAT':
					if (!this.gf_datecheck(vs_Data))
					{
						alert("일자가 부정확힙니다.!!");
						this.ds_edit.setColumn(vn_row, "SUDAT",'');
						
						return;
					}
					
					this.ds_edit.setColumn(vn_row, "IO_DATE",vs_Data);
					this.ds_edit.setColumn(vn_row, "INSDAT",vs_Data);
					this.ds_edit.setColumn(vn_row, "YEBI1",vs_Data);
					
					break;
					
				case 'IOAMT':
					
					var vAmt = parseFloat(vs_Data);
				 	var vVat = Math.floor( ( vAmt * 10 / 11 ) * 0.1 );
				 	var vPrc = Math.floor( vAmt - vVat );
				 	
				 	this.ds_edit.setColumn(vn_row, "UNPRC",vPrc);
					this.ds_edit.setColumn(vn_row, "DYEBI3",vVat);
				 	
					break;
			}
		}
	}
	else
	{		
		vs_Data = e.postvalue;
		if(obj.parent.name == 'DivHead')
		{
			
			switch (obj.name)
			{
				case 'msk_sdate' :
					if (NXCore.isEmpty(vs_Data) || vs_Data == '')
					{
						var vToday = this.gf_today();
						var vPoday = this.gf_addmonths(vToday, -1);
						
						this.ds_head.setColumn(0, "ARG_SYYMM",vPoday.substr(0,6));
						
						var vResult = this.gf_SelectSql_sync("ds_Temp: SELECT MAX(CLDATE) FROM P4_CALENDAR WHERE CLDATE LIKE '"+vPoday.substr(0,6)+"'||'%' ", "SELECT_reffpf_5A", "ff_Callback_sync",0);
						
						this.ds_head.setColumn(0, "ARG_SALEDT",vResult[1]);
						
						this.DivHead.msk_sdate.setFocus();
						
						return;
					}
					
					if (!this.gf_datecheck(vs_Data + '01'))
					{
						alert("기준년월를 정확히 입력하세요!!");
						var vToday = this.gf_today();
						var vPoday = this.gf_addmonths(vToday, -1);
						
						this.ds_head.setColumn(0, "ARG_SYYMM",vPoday.substr(0,6));
						
						var vResult = this.gf_SelectSql_sync("ds_Temp: SELECT MAX(CLDATE) FROM P4_CALENDAR WHERE CLDATE LIKE '"+vPoday.substr(0,6)+"'||'%' ", "SELECT_reffpf_5A", "ff_Callback_sync",0);
						
						this.ds_head.setColumn(0, "ARG_SALEDT",vResult[1]);
						
						this.DivHead.msk_sdate.setFocus();
						
						return;
					}
					
					var vResult = this.gf_SelectSql_sync("ds_Temp: SELECT MAX(CLDATE) FROM P4_CALENDAR WHERE CLDATE LIKE '"+vs_Data.substr(0,6)+"'||'%' ", "SELECT_reffpf_5A", "ff_Callback_sync",0);
					
					this.ds_head.setColumn(0, "ARG_SALEDT",vResult[1]);
										
					break;
					
					
				case 'cal_saledt' :
					if (NXCore.isEmpty(vs_Data) || vs_Data == '')
					{
						var vPoday = this.ds_head.getColumn(0, "ARG_SYYMM");
						var vResult = this.gf_SelectSql_sync("ds_Temp: SELECT MAX(CLDATE) FROM P4_CALENDAR WHERE CLDATE LIKE '"+vPoday.substr(0,6)+"'||'%' ", "SELECT_reffpf_5A", "ff_Callback_sync",0);
						
						this.ds_head.setColumn(0, "ARG_SALEDT",vResult[1]);
						
						this.DivHead.cal_saledt.setFocus();
						
						return;
					}
					
					if (!this.gf_datecheck(vs_Data))
					{
						alert("전표일자를 정확히 입력하세요!!");
						var vPoday = this.ds_head.getColumn(0, "ARG_SYYMM");
						
						var vResult = this.gf_SelectSql_sync("ds_Temp: SELECT MAX(CLDATE) FROM P4_CALENDAR WHERE CLDATE LIKE '"+vPoday.substr(0,6)+"'||'%' ", "SELECT_reffpf_5A", "ff_Callback_sync",0);
						
						this.ds_head.setColumn(0, "ARG_SALEDT",vResult[1]);
						this.DivHead.cal_saledt.setFocus();
						
						return;
					}
					var sdate = this.ds_head.getColumn(0,"ARG_SYYMM") + '01';
					var edate = this.ds_head.getColumn(0,"ARG_SYYMM") + '31';
					//var vs_date = this.ds_head.getColumn(0,"ARG_SYYMM");
					//var vs_saledate = vs_Data.substr(0,6);
					if(vs_Data < sdate || vs_Data > edate)
					{
						alert('기준년월에 맞지 않습니다.');
						var vPoday = this.ds_head.getColumn(0, "ARG_SYYMM");
						
						var vResult = this.gf_SelectSql_sync("ds_Temp: SELECT MAX(CLDATE) FROM P4_CALENDAR WHERE CLDATE LIKE '"+vPoday.substr(0,6)+"'||'%' ", "SELECT_reffpf_5A", "ff_Callback_sync",0);
						
						this.ds_head.setColumn(0, "ARG_SALEDT",vResult[1]);
						this.DivHead.cal_saledt.setFocus();
					}
										
					break;
					
				case 'ed_sales_empno' :
					var vCol_no, vCol_name;
                    vCol_no     = "ARG_SALE_EMP";
                    vCol_name   = "ARG_SALE_EMPNAME";
					if (NXCore.isEmpty(vs_Data) || vs_Data == '')
					{
						this.ds_head.setColumn(0, vCol_no,'');
						this.ds_head.setColumn(0, vCol_name,'');
						return;
					}
					
					var vOpenSale = new Array();
                    vOpenSale[0] = 'SAWON';
                    vOpenSale[1] = vs_Data;
                    
                    var vReturnSale = this.gfi_get_name_sale(vOpenSale);
                    
                    if (vReturnSale[1] == 'NOT EXISTS' ||  vReturnSale[5] != '1')
                    {
                        alert("사원번호가 존재하지 않거나 현 재직자가 아닙니다.");

                        this.ds_head.setColumn(0, vCol_no,'');
						this.ds_head.setColumn(0, vCol_name,'');
						return;
                    }
                    else
                    {
                        this.ds_head.setColumn(0, vCol_no,vReturnSale[1]);
						this.ds_head.setColumn(0, vCol_name,vReturnSale[2]);
						return;
                    }
					break;
					
					
				case 'ed_cvcod' :
				case 'ed_ecvcod' :
					var vCol_no, vColname;
                    if (obj.name == 'ed_cvcod')
                    {
                        vCol_no = 'ARG_SCVCOD';
                        vColname = 'ARG_SCVNAS';
                    }
                    else
                    {
						vCol_no = 'ARG_ECVCOD';
                        vColname = 'ARG_ECVNAS';
                    }
										
					if (NXCore.isEmpty(vs_Data) || vs_Data == '')
					{
						this.ds_head.setColumn(0, vCol_no,'');
						this.ds_head.setColumn(0, vColname,'');
						return;
					}
					
					var vOpenSale = new Array();
                    vOpenSale[0] = 'VNDMST';
                    vOpenSale[1] = vs_Data;
                    vOpenSale[2] = '';
                    vOpenSale[3] = '1';
                    
                    var vReturnSale = this.gfi_get_name_sale(vOpenSale);
                    
                    if(this.ff_Vndwarn(vReturnSale) == -1)return;
                    
                    if (vReturnSale[99] == 'POPUP') 
                    {
						this.ff_co_popu_vndsale_f("popup_ed_con_cvcod_head", vReturnSale);
						return;
					}
                                                            
                    if (vReturnSale[1] == 'NOT EXISTS')
                    {
                        alert("거래처가 없거나 지금 현재 거래중인 고객이 아닙니다.");

                        this.ds_head.setColumn(0, vCol_no,'');
						this.ds_head.setColumn(0, vColname,'');
						return;
                    }
                    else if(vReturnSale[5] == '8' || vReturnSale[5] == '9')
                    {
						if (application.confirm(" 폐(휴)업 거래처입니다. 작업을 계속 하시겠습니까?") == false)return;
                    }
                    
                    if(obj.name == 'ed_cvcod')
                    {
						this.ds_head.setColumn(0, 'ARG_ECVCOD',vReturnSale[1]);
						this.ds_head.setColumn(0, 'ARG_ECVNAS',vReturnSale[2]);
						
                    }
                    
                    this.ds_head.setColumn(0, vCol_no,vReturnSale[1]);
					this.ds_head.setColumn(0, vColname,vReturnSale[2]);
					
					break;
					
				case 'chk_cvchg' :
					this.ds_list.clearData();
					this.ds_edit.clearData();
					this.ds_hist.clearData();
					if(vs_Data == 'Y')
					{
						iv_SvcAct = "co/popu/co_popu_pack_crt_f_1q_1.jsp";
						this.grd_list.setFormat("LIST2");
						this.ds_head.setColumn(0, 'ARG_GUBUN','N');
					}
					else
					{
						iv_SvcAct = "co/popu/co_popu_pack_crt_f_1q.jsp";
						this.grd_list.setFormat("LIST1");
						this.ds_head.setColumn(0, 'ARG_GUBUN','Y');
					}
					this.btn_retrieve_onclick();
					break;
					
				case 'chk_gubun' :
					this.ds_list.clearData();
					this.ds_edit.clearData();
					this.ds_hist.clearData();
					if(vs_Data == 'Y')
					{
						iv_SvcAct = "co/popu/co_popu_pack_crt_f_1q.jsp";
						this.grd_list.setFormat("LIST1");
						this.ds_head.setColumn(0, 'ARG_CVCHG','N');
					}
					else
					{
						iv_SvcAct = "co/popu/co_popu_pack_crt_f_1q_1.jsp";
						this.grd_list.setFormat("LIST2");
						this.ds_head.setColumn(0, 'ARG_CVCHG','Y');
					}
					this.btn_retrieve_onclick();
					break;
			}						
		}		
		
	}
	
}

this.ff_Object_onrbuttondown = function(obj:Edit, e:nexacro.MouseEventInfo)
{
	var vs_Data = e.postvalue;
	var vs_Arg = ''; 
	var vn_Row = e.row; 
			
	if( obj.readonly ) return ;		//readonly 상태 이면 팝업 취소 
	
	// Grid과 다른 object로 나눠서 처리 
	// obj가 Grid를 확인해서 처리함	
	if(obj == '[object Grid]')
	{	
			
	}
	else
	{
		if (obj.parent.name == 'DivHead')
		{		
								//데이터셋의 row 위치값
			switch (obj.name)
			{
				case 'ed_sales_empno':
					
					this.ff_co_popu_sawon_sale_f("popup_ed_sales_empno_head", '' + '|' + '' + '|' +  vs_Data);			
					
					break;		
							
				case 'ed_cvcod':
					
					var vOpenParam = new Array();
					vOpenParam[0] = null;
					vOpenParam[1] = vs_Data;
					vOpenParam[3] = null;
					vOpenParam[4] = null;
					//vOpenParam[5] = vData;
					this.ff_co_popu_vndsale_f("popup_ed_con_cvcod_head", vOpenParam);
					
					break;	
					
				case 'ed_ecvcod':
					
					var vOpenParam = new Array();
					vOpenParam[0] = null;
					vOpenParam[1] = vs_Data;
					vOpenParam[3] = null;
					vOpenParam[4] = null;
					//vOpenParam[5] = vData;
					this.ff_co_popu_vndsale_f("popup_ed_con_ecvcod_head", vOpenParam);
					
					break;
			}
		}		
		
	}
}

//  거래처 찾기 
this.ff_co_popu_vndsale_f = function(strId, arg_parm)
{
	var resultForm = this.gf_showPopup(strId,  "co_popu::co_popu_vndsale_f.xfdl", {width:600, height:700},
			{	OpenRetv:   'Y',   // popup open 즉시 조회  
				MultSelect: 'N',   // MULTI LINE 선택
				Argument:   arg_parm  // 조회조건 파라메터 
			}, {modal:true, layered:true, autosize:false, callback:"ff_AfterPopup"});

}
// 성명 찾기 
this.ff_co_popu_sawon_sale_f = function(strId, arg_parm)
{
	var resultForm = this.gf_showPopup(strId,  "co_popu::co_popu_sawon_f.xfdl", {width:500, height:500},
		{	OpenRetv:   'Y',   // popup open 즉시 조회  
			MultSelect: 'N',   // MULTI LINE 선택
			Argument:   arg_parm // 조회조건 파라메터 
		}, {modal:true, layered:true, autosize:false, callback:"ff_AfterPopup"});

}

this.ff_AfterPopup = function (strId, obj)
{

	var va_Data = this.gf_popup_data(obj);  // popup 에서 넘어온 data 를 array 로 받아온다.

	var vi_row;
	switch(strId)
	{
	
		case "popup_ed_sales_empno_head":      // 사원 찾기 head에서 변경되었을경우 
		    if (va_Data == false) 
		    {
				this.ds_head.setColumn(0,"ARG_SALE_EMP","");
				this.ds_head.setColumn(0,"ARG_SALE_EMPNAME","");			
			}
			else 
			{
				this.ds_head.setColumn(0,"ARG_SALE_EMP",va_Data[0][0]);
				this.ds_head.setColumn(0,"ARG_SALE_EMPNAME",va_Data[0][1]);				
				
			}	
			break;
	
		case "popup_ed_con_cvcod_head":      // 사원 찾기 head에서 변경되었을경우 
		    		    
		    if (va_Data == false) 
		    {
				this.ds_head.setColumn(0,"ARG_SCVCOD","");
				this.ds_head.setColumn(0,"ARG_SCVNAS","");
			}
			else 
			{
			
				this.ds_head.setColumn(0,"ARG_SCVCOD",va_Data[0][0]);
				this.ds_head.setColumn(0,"ARG_SCVNAS",va_Data[0][2]);
				this.ds_head.setColumn(0,"ARG_ECVCOD",va_Data[0][0]);
				this.ds_head.setColumn(0,"ARG_ECVNAS",va_Data[0][2]);
			}	
			
			break;
			
		case "popup_ed_con_ecvcod_head":      // 사원 찾기 head에서 변경되었을경우 
		    
		    if (va_Data == false) 
		    {
				this.ds_head.setColumn(0,"ARG_ECVCOD","");
				this.ds_head.setColumn(0,"ARG_ECVNAS","");
			}
			else 
			{
								
				this.ds_head.setColumn(0,"ARG_ECVCOD",va_Data[0][0]);
				this.ds_head.setColumn(0,"ARG_ECVNAS",va_Data[0][2]);
				
			}	
			break;
			
						
	}
    return;
}

this.ff_Calc = function (vDw, vRow, vCall)
{
	var nAmt = 0;
    var vSave_amt = 0;

    var vCvchg = this.ds_head.getColumn(0,"ARG_CVCHG");
    var vGubun = this.ds_head.getColumn(0,"ARG_GUBUN");
    
    if  (vCvchg == 'Y')
    {
 		 var vChk = vDw.getColumn(vRow,"SEL");
 	}
 	else
 	{
		var vChk = vDw.getColumn(vRow,"SEL");
	}
	
	var vCvnas    = vDw.getColumn(vRow,"CVNAS");
    var vCondat   = vDw.getColumn(vRow,"CONDAT");
	var vTax_gbn1 = vDw.getColumn(vRow,"TAX_GBN1");
	var vTax_gbn2 = vDw.getColumn(vRow,"TAX_GBN2");
	var vTax_gbn3 = vDw.getColumn(vRow,"TAX_GBN3");
	var vTax_gbn3_month = vDw.getColumn(vRow,"TAX_GBN3_MONTH");
	var vTax_gbn4 = vDw.getColumn(vRow,"TAX_GBN4");
	
	var vCon_spc_gbn = vDw.getColumn(vRow,"CON_SPC_GBN");

	var vAmount   = vDw.getColumn(vRow,"AMOUNT");                   // 계약 금액
	var vSugum    = vDw.getColumn(vRow,"USE_SUGUM_AMOUNT");         // 수금 총액
	var vSugum_aft= vDw.getColumn(vRow,"IPGUM_AFT");								// 당월 이후 수금액
	var vPack     = vDw.getColumn(vRow,"PACK_SALE");                              // 당월 팩 판매
	var vTot_Pack = vDw.getColumn(vRow,"TOT_PACK");                               // 총 팩 판매
	var vIoamt    = vDw.getColumn(vRow,"IOAMT");                                  // 당월 팩 출하, 반품
	var vJjtot    = vDw.getColumn(vRow,"JOJUNG_TOTAL");                           // 조정 금액 합계
	var vJjsale   = vDw.getColumn(vRow,"JOJUNG_SALE");                            // 당월 조정 금액
	
	var vSalesum  = vDw.getColumn(vRow,"MONTH_SALE_SUM");                         // 계산서 발행 금액
	var vPrvamt   = vDw.getColumn(vRow,"PRV_AMOUNT");               // 전계약 이관 금액
    
    vDw.set_enableevent(false);
    
   
    if (vTax_gbn1 == 'Y')
	{
		if (vGubun == 'Y') 
		{
	    	if (vSugum - vSalesum - vPack > 0) 
	    	{
				vDw.setColumn(vRow,"CRT_AMT", Math.floor(vSugum - vTot_Pack));
	        	vDw.setColumn(vRow,"CRT_AMT_SAVE", Math.floor(vSugum - vTot_Pack));
	        	
	    		if (vCondat < '20140101') 
	    		{
	    			if (application.confirm(vRow+1 + " 행 " + vCvnas + " - 2014년 이전 수금분 발행 계약입니다. \n"
	    			          + " 이상 유무를 확인하세요.\n 계속하시겠습니까? ") == false)
	    			{
						vDw.set_enableevent(true);
						return;
					}
	    	    }
	    	}
	    }

	    if (vCvchg == 'Y') 
	    {
			if (vSugum - vSalesum - vPack > 0) 
			{
				vDw.setColumn(vRow,"CRT_AMT", Math.floor(vSugum - vTot_Pack));
				vDw.setColumn(vRow,"CRT_AMT_SAVE", Math.floor(vSugum - vTot_Pack));
	        	
	    		if (vCondat < '20140101') 
	    		{
	    			if (application.confirm(vRow+1 + " 행 " + vCvnas + " - 2014년 이전 수금분 발행 계약입니다. \n"
	    			          + " 이상 유무를 확인하세요.\n 계속하시겠습니까? ") == false)
	    			{
	    			          vDw.set_enableevent(true);
	    			          return;
	    			}
	    	    }
	    	}
		}
	}
	else if(vTax_gbn2 == 'Y')
	{
		
		if ( vIoamt == 0 && vChk == '0' ) 
		{
		     nAmt = 0;
		     vDw.setColumn(vRow,"CRT_AMT", nAmt);
		     vDw.setColumn(vRow,"CRT_AMT_SAVE", nAmt);		     
		}
		else
		{
			if (vChk == '1') 
			{
			 	 vIoamt = vDw.getColumn(vRow,"CRT_AMT");
			}
			
			if ( vIoamt > vPack ) 
			{
				if  (vPack > 0)
				{
					nAmt = parseInt(vIoamt) - Math.floor(vPack);
				}
				else
				{
					nAmt = parseInt(vIoamt) + Math.floor(vPack);
				}
				
				if  (vCon_spc_gbn == '6' || vCon_spc_gbn == '8')
		        {
		             vSave_amt = vAmount + vPrvamt;
		        }
		        else
		        {
					vSave_amt = vAmount;
				}
								
				if (vTot_Pack + nAmt + vJjtot > vSave_amt) 
				{
				
					if (this.gf_Getsyscnfg('S', 16, '01') != "Y") 
					{
						if (application.confirm(vRow+1 + " 행의 (총PACK판매금액 + 발행예정금액)이 계약금액을 초과합니다." + "\n 그대로 발행하시겠습니까?") == false)
		                {
	                         vDw.setColumn(vRow,"CHK", '0');
	                         vDw.setColumn(vRow,"CRT_AMT", 0);
	                         vDw.setColumn(vRow,"CRT_AMT_SAVE", 0);
	                         
	                         vDw.set_enableevent(true);
	                         
	                         return;
	                    }
	                    else
						{
							vDw.setColumn(vRow,"CRT_AMT", nAmt);
							vDw.setColumn(vRow,"CRT_AMT_SAVE", 0);
						}
					}
					else
					{
						
						alert(vRow+1 + " 행의 (총PACK판매금액 + 발행예정금액)이 계약금액을 초과합니다..");

						vDw.setColumn(vRow,"CHK", '0');
						vDw.setColumn(vRow,"CRT_AMT", 0);
						vDw.setColumn(vRow,"CRT_AMT_SAVE", 0);
						
						vDw.set_enableevent(true);

						return;
					 }
				 }
				 else
				 {
					vDw.setColumn(vRow,"CRT_AMT", nAmt);
					vDw.setColumn(vRow,"CRT_AMT_SAVE", nAmt);
				 }
				
			 }
			 else if(vIoamt < 0) 
			 {
				if (vIoamt <= vPack) 
				{
					nAmt = Math.floor((vPack - vIoamt) * -1);

		       	    vDw.setColumn(vRow,"CRT_AMT", nAmt);
	                vDw.setColumn(vRow,"CRT_AMT_SAVE", nAmt);
		       	} 
		       	else 
		       	{
	         	    nAmt = Math.floor(vIoamt - vPack);

	         	    vDw.setColumn(vRow,"CRT_AMT", nAmt);
	                vDw.setColumn(vRow,"CRT_AMT_SAVE", nAmt);
		         }
			  }
			
		}
	}
	
	
	
	if ( vDw.getColumn(vRow,"CRT_AMT") == 0) 
	{		
	    if (vCall == '1') 
	    {
		    alert(vRow+1 + ' 행의 발행예정 금액이 계산되지 않았습니다..\n확인하시고 필요하면 직접 발행예정금액 에 금액을 입력하세요');

		    vDw.setColumn(vRow,"CHK", '0');
	        vDw.setColumn(vRow,"CRT_AMT", 0);
	        vDw.setColumn(vRow,"CRT_AMT_SAVE", 0);
	        
	        vDw.set_enableevent(true);
		}
		else
		{
		    vDw.setColumn(vRow,"CHK", '0');
	        vDw.setColumn(vRow,"CRT_AMT", 0);
	        vDw.setColumn(vRow,"CRT_AMT_SAVE", 0);
	        
	        vDw.set_enableevent(true);
	    }

	    return;
	}
	
	vDw.set_enableevent(true);
}

this.ff_Savertn = function()
{
	// 전표번호 채번
	var vJunpyoseq = 0, vJseq = 0, vSql, vCheck = false;
	var vToday = this.ds_head.getColumn(0,"ARG_SALEDT"); 
	var vYymm = this.ds_head.getColumn(0,"ARG_SYYMM"); 
	var vEmpno = application.gvs_empid;	
	var vn_Ioamt;
	
	var vResult = this.gf_SelectSql_sync("ds_Temp: SELECT DEPTCODE FROM P1_MASTER WHERE EMPNO = '"+vEmpno+"' ", "SELECT_reffpf_5A", "ff_Callback_sync",0);
	var vDeptcode = vResult[1];
	
	vJunpyoseq = this.gf_get_junpyo(vToday,"C0");
	
	if (NXCore.isEmpty(vJunpyoseq) || vJunpyoseq == '')
	{
		alert("관리 번호가 채번되지 않았습니다");
		return -1;
	}

	/*if (vToday < ivFrdate || vToday > ivTodate) 
	{
		alert(" 해당 전표일자로 팩매출 생성할 수 없습니다.");
		return -1;
	}*/

	var vJpno = vToday + vJunpyoseq.substr(0, 4);
	
	for (var i=0; i <= this.ds_list.rowcount -1;i++)
	{
		if (this.ds_list.getColumn(i,"CHK") != '1') continue;

	 	var vEstamt  = this.ds_list.getColumn(i,"AMOUNT");
	 	var vTotPack = this.ds_list.getColumn(i,"TOT_PACK");
	 	var vAmount  = this.ds_list.getColumn(i,"CRT_AMT");
	 	var vPrvamt  = this.ds_list.getColumn(i,"PRV_AMOUNT");
	 	var vEstno   = this.ds_list.getColumn(i,"ESTNO");
		
	 	if (vAmount == 0) continue;
	 	
	 	if (!NXCore.isEmpty(vEstno) && vEstno != '')
		{
		
			//var vSql = this.gf_SelectSql_sync("ds_Temp: SELECT SUM(A.IOAMT * B.CALVALUE) AS IOAMT FROM IMHIST_SAL A, IOMATRIX B WHERE A.IOGBN = B.IOGBN AND A.ESTNO = '"+vEstno+"' AND A.IO_DATE LIKE '"+vYymm+"%' AND A.ITNBR IN (SELECT RFNA4 FROM REFFPF WHERE RFGUB <> '00' AND RFCOD = '5S') ", "SELECT_reffpf_5A", "ff_Callback_sync",0);
			 var vSql = this.gf_SelectSql_sync("ds_Temp: SELECT SUM(A.IOAMT * B.CALVALUE) AS IOAMT FROM IMHIST_SAL A, IOMATRIX B WHERE A.IOGBN = B.IOGBN AND A.ESTNO = '"+vEstno+"' AND A.IO_DATE  <= '"+vYymm+"'||'31' AND A.ITNBR IN (SELECT RFNA4 FROM REFFPF WHERE RFGUB <> '00' AND RFCOD IN ('5S','2L')) ", "SELECT_reffpf_5A", "ff_Callback_sync",0);
			 
			if(NXCore.isEmpty(vSql[1]) || vSql[1] == '')
			{
				vn_Ioamt = 0;
			}
			else
			{
				vn_Ioamt = vSql[1];
			}
			
		}
		else
		{
			vn_Ioamt = 0;
		}
	 	
	 	//총팩판매금액 + 발행예정금액 + 동종골 판매 및 반품금액 > 계약금액 + 이관금액
	 		 	
	 	if ((vTotPack + vAmount + vn_Ioamt) > (vEstamt + vPrvamt)) 
	 	{
	 		alert(i+1 + " 행의  계산서 발행금액이 계약금액을 초과합니다.");
			return -1;
		}
		
		var vSamt = this.ds_list.getColumn(i,"CRT_AMT_SAVE");
        if (vAmount > vSamt) 
        {
			if (this.gf_Getsyscnfg('S', 16, '01') != "Y") 
			{
				if (application.confirm(i + " 행의  발행예정금액이 발행 가능한 금액을 초과합니다."
                           + "\n 그대로 발행하시겠습니까?") == false) return -1;
			}
			else
			{
				if ((vEstamt + vPrvamt) < (vTotPack + vAmount)) 
				{
                   	 alert(i + " 행의  발행예정금액이 발행 가능한 금액을 초과합니다..");
                  	 return -1;
                }
                else
                {
					if (application.confirm(i + " 행의 발행예정금액이 당월의 발행 가능한 금액을 초과합니다."
                           			    + "\n 그대로 발행하시겠습니까?") == false) return -1;
                }
			}
        }
        
        vCheck = true;

	 	var vCvcod  = this.ds_list.getColumn(i,"CVCOD");
	 	var vSarea  = this.ds_list.getColumn(i,"SAREA");
	 	var vSteam  = this.ds_list.getColumn(i,"STEAM");
	 	var vEstno  = this.ds_list.getColumn(i,"ESTNO");
	 	var vSano   = this.ds_list.getColumn(i,"SANO");

		var vClosedt = this.ds_list.getColumn(i,"CLOSEDT");
		
		if (!NXCore.isEmpty(vClosedt) && vClosedt != '' && vClosedt != '00000000')
		{
		    if (vToday > vClosedt)
		    {
		        alert(vCvcod + "의 폐업일 보다 팩판매 발행일이 늦습니다.");
		        return -1;
		    }
		}
		
		// 부가세,공급단가 계산
		var vVat = Math.floor( ( vAmount * 10 / 11 ) * 0.1 );
		var vPrc = Math.floor( vAmount - vVat );

	 	// 전표번호 구성
	 	vJseq = vJseq + 1;
	 	vIojpno = vJpno + this.gf_NumToStr(vJseq,3);
	 	
	 	vSql = "INSERT INTO IMHIST_SAL "
	 	     + "(IOJPNO,	IOGBN, 		SUDAT,		ITNBR, 		PSPEC, 		DEPOT_NO, 	OPSEQ, 		CVCOD, 		"
	 	     + " IOREQTY, 	IOQTY, 		IOPRC, 		IOAMT, 		INSDAT, 	QCGUB, 		IO_CONFIRM, IO_DATE,  	"
	 	     + " IO_EMPNO, 	INPCNF, 	JNPCRT, 	IOREDEPT, 	IOREEMP, 	SAUPJ, 		FILSK,		BIGO,		"
	 	     + " IOFAQTY, 	IOPEQTY, 	IOSPQTY,	IOCDQTY, 	IOSUQTY, 	CRT_USER, 	DYEBI3,		YEBI2,		"
	 	     + " DYEBI1,	DYEBI2,		FORAMT,		YEBI1,		LCLGBN,		INV_SEQ,	STEAMCD,	SAREA,		"
	 	     + " IPSEQ,		SUBSEQ,		BALJU_QTY,	VND_CGBN,	GIFTNO_SEQNO,	UNPRC,	SALE_CVCOD,	ESTNO,      "
	 	     + " CHECKING_NO) "
	 	     + "VALUES																"
	 	     + "('"+vIojpno+"',	'O20',		'"+vToday+"',	'PACK판매',	'.',		'ZS010',	'9999',		'"+vCvcod+"',	"
	 	     + " 1,		1,		"+vAmount+",	"+vAmount+",	'"+vToday+"',	'1',		'Y',		'"+vToday+"',	"
	 	     + " '"+vEmpno+"',	'I',		'081',		'"+vDeptcode+"','"+vEmpno+"',	'10',		'N',		',',		"
	 	     + " 0,		0,		0,		0,		1,		'"+vEmpno+"',	"+vVat+",	'KRW',		"
	 	     + " 0,		0,		0,		'"+vToday+"',	'V',		0,		'"+vSteam+"',	'"+vSarea+"',	"
	 	     + " 0,		0,		0,		'4',		0,		"+vPrc+",	'"+vCvcod+"',	'"+vEstno+"', '" + vSano + "')	";
                 
         
         this.gf_UpdateSql_sync(vSql, 'UPDATE_SQL',"ff_Callback_sync", 0);
        
	}
	
	/*var vIodate = this.ds_head.getColumn(0, "ARG_SYYMM");
	    
    var vSql = "UPDATE IMHIST_SAL SET YEBI4 = '', CHECKNO = '' "
					+ "  WHERE IOJPNO IN (SELECT IOJPNO FROM IMHIST_SAL A, SALEH B WHERE A.CHECKNO = B.CHECKNO(+) AND A.IO_DATE LIKE '"+vIodate+"'||'%' AND B.CHECKNO IS NULL AND A.CHECKNO IS NOT NULL) " ;
         
    this.gf_UpdateSql_sync(vSql, 'UPDATE_SQL',"ff_Callback_sync", 0);*/
		
	if (vCheck)
	{		
		alert("팩판매 매출자료가 생성되었습니다");
		
		this.btn_retrieve_onclick();		
	}
	else
	{
		alert("생성할 자료가 없습니다");
		return -1;
	}

	return 1;
}

this.ff_Editlist = function(vRow)
{
	var vEstno = this.ds_list.getColumn(vRow ,"ESTNO");

    this.ds_edit.clearData();
    this.ds_hist.clearData();
    
    this.ds_head.setColumn(0, "ARG_ESTNO", vEstno);

	this.ff_Tran("SELECT_EDIT");
	this.ff_Tran("SELECT_HIST");
	

}

// 조회 문장 
this.ff_Tran = function(strSvcId) 
{
	switch (strSvcId)
	{
		case "SELECT" :
			// 넘겨줄 파라메터 셋팅
			// 구분값에 따라 다른 SQL 조회
			
			if (NXCore.isEmpty(this.ds_head.getColumn(0,"ARG_SALE_EMP"))) 
			{
				this.ds_head.setColumn(0, "ARG_SALE_EMP_P", '%')
			}
			else 
			{
				this.ds_head.setColumn(0, "ARG_SALE_EMP_P", this.ds_head.getColumn(0,"ARG_SALE_EMP"));
			}
			
			if (NXCore.isEmpty(this.ds_head.getColumn(0,"ARG_SCVCOD"))) 
			{
				this.ds_head.setColumn(0, "ARG_SCVCOD_P", '.')
			}
			else 
			{
				this.ds_head.setColumn(0, "ARG_SCVCOD_P", this.ds_head.getColumn(0,"ARG_SCVCOD"));
			}
			
			if (NXCore.isEmpty(this.ds_head.getColumn(0,"ARG_ECVCOD"))) 
			{
				this.ds_head.setColumn(0, "ARG_ECVCOD_P", 'zzzzzzzzz')
			}
			else 
			{
				this.ds_head.setColumn(0, "ARG_ECVCOD_P", this.ds_head.getColumn(0,"ARG_ECVCOD"));
			}
			
			if(this.ds_head.getColumn(0,"ARG_CHOICE") == '1')
			{
				this.ds_head.setColumn(0, "ARG_SALE_EMP_P", this.ds_head.getColumn(0,"ARG_SALE_EMP_P"));
				this.ds_head.setColumn(0, "ARG_VND_EMP", '%');
			}
			else
			{
				this.ds_head.setColumn(0, "ARG_SALE_EMP_P", '%');
				this.ds_head.setColumn(0, "ARG_VND_EMP", this.ds_head.getColumn(0,"ARG_SALE_EMP_P"));
			}
						
			//trace(this.ds_head.saveXML());
			//alert(iv_SvcAct);
			v_SvcAct = iv_SvcAct;
			v_InDataset = "ds_para=ds_head";	// 반드시 기술할것
			v_OutDataset = "ds_list=output1";	// 반드시 output1으로 기술할것
			v_Argument = "";
			break;
			
		case "SELECT_EDIT" :
		
			v_SvcAct = "co/popu/co_popu_pack_crt_f_2q.jsp?dbconn=0";
			v_InDataset = "ds_para=ds_head";	// 반드시 기술할것
			v_OutDataset = "ds_edit=output1";	// 반드시 output1으로 기술할것
			v_Argument = "";
			break;
			
		case "SELECT_HIST" :
		
			v_SvcAct = "co/popu/co_popu_pack_crt_f_3q.jsp?dbconn=0";
			v_InDataset = "ds_para=ds_head";	// 반드시 기술할것
			v_OutDataset = "ds_hist=output1";	// 반드시 output1으로 기술할것
			v_Argument = "";
			break;
			
		case "SAVE_EDIT" : 
		        
				v_SvcAct		= "co/popu/co_popu_pack_crt_f_2tr.jsp?dbconn=0" ;
				v_InDataset		= "input1=ds_edit:U";       // 반드시 input1으로 기술할것
				v_OutDataset	= "";
				break;
			
	} 
	this.gf_Transaction_Async(strSvcId, v_SvcAct, v_InDataset, v_OutDataset,"ff_Callback");
}

/*----------------------------------------------------------------------------------
 * 설명      : TRANSACTION 후처리 함수
 * 파라미터 : strSvcId - TRANSACTION ID, nErrorCode - Error Code, strErrorMsg - Error Msg
 * Return값  :
 * 작성자   : 박두현
 * 작성일   : 2010.05.06
 *----------------------------------------------------------------------------------*/
this.ff_Callback =  function (sSvcID, ErrorCode, ErrorMsg)
{
	if (ErrorCode < 0)
	{
		NXCore.alert(ErrorMsg);
		return;
	}
	switch (sSvcID)
	{
		case "SELECT" :
			if (this.ds_list.rowcount < 1)
			{
				this.gf_message_chk("110", ""); // 조회 및 출력할 자료가 없습니다.
			}
			/*else
			{
				this.ff_Editlist(0);
			}*/
			
			var vToday = this.gf_today();   //오늘날짜
			var vSYYMM = this.ds_head.getColumn(this.ds_head.rowposition,"ARG_SYYMM");  //기준년월 불러오기
			var vResult = this.gf_SelectSql_sync("ds_Temp: SELECT MAX(CLDATE) FROM P4_CALENDAR WHERE CLDATE LIKE '"+ vSYYMM +"'||'%' ", "SELECT_reffpf_5A", "ff_Callback_sync",0);
			if(vToday == vResult[1])
			{
				this.ds_list.set_enableevent(false);
				for(var i = 0; i <= this.ds_list.rowcount; i++)
				{
					this.ds_list.setColumn(i,"CHK_TYPE",'none');
					this.ds_list.setColumn(i,"AMT_TYPE",'none');
				}
				this.ds_list.set_enableevent(true);
			}
			
			break;
			
		case "SAVE_EDIT" : 
			alert("정상적으로 저장되었습니다.");
			
			
			break;
	}
}  

this.btn_excel_chg_onclick = function(obj:Button,  e:nexacro.ClickEventInfo)
{
	this.gf_excel_download(this.grd_list);
}

this.ds_list_onrowposchanged = function(obj:Dataset, e:nexacro.DSRowPosChangeEventInfo)
{
	this.ff_Editlist(this.ds_list.rowposition);
}

this.btn_calc_onclick = function(obj:Button,  e:nexacro.ClickEventInfo)
{
	var vSaledt = this.ds_head.getColumn(0,"ARG_SALEDT");
	if (vSaledt < ivFrdate || vSaledt > ivTodate) 
	{
		alert(" 해당 전표일자로 팩매출 생성할 수 없습니다.");
		return;
	}
	
	var nRow = this.ds_list.rowcount;
	
    for (var i=0; i<= nRow -1; i++) 
    {
    	if (this.ds_list.getColumn(i,"SEL") == '1')continue;
    	
    	var vs_Pack_chk = this.ds_list.getColumn(i,"PACK_CHK");
    	var vs_Cvnas = this.ds_list.getColumn(i,"CVNAS");
    	
    	if(vs_Pack_chk == 'Y')
    	{
			alert("계약처 : " + vs_Cvnas + '에 동월로 PACK출하한 내역이 있습니다. '
			              + '\n 자동계산은 불가합니다. 제외에 체크하시고 자동계산을 하세요');
			continue;
    	}

		this.ds_list.set_enableevent(false);
		this.ds_list.setColumn(i, "CHK", '1');
		this.ds_list.set_enableevent(true);
		
        this.ff_Calc(this.ds_list, i, '2');
    }
	
    return;
}

this.btn_save2_onclick = function(obj:Button,  e:nexacro.ClickEventInfo)
{
	this.ff_Tran("SAVE_EDIT");
}

this.btn_delete2_onclick = function(obj:Button,  e:nexacro.ClickEventInfo)
{
	var vRow = this.ds_edit.rowposition;
	if (vRow < 0)
	{
		alert("자료 조회후 삭제하세요");
		return;
	}

	var vEstno    = this.ds_edit.getColumn(vRow,"ESTNO")
	var vDate     = this.ds_edit.getColumn(vRow,"IO_DATE")
	var vBigo     = this.ds_edit.getColumn(vRow,"BIGO")
	var vCheckno  = this.ds_edit.getColumn(vRow,"CHECKNO")
	var vSaledt   = this.ds_edit.getColumn(vRow,"YEBI4")

	if ( vCheckno.length > 0 || vSaledt > 0 )
	{
		alert("세금계산서가 발행된 자료는 삭제할 수 없습니다");
		return;
	}

	if (application.confirm(vDate + '일 ' + vBigo + ' 에 대한 Pack판매 자료를 삭제하시겠습니까?') == false) return;

	this.ds_edit.deleteRow(vRow);
	
	this.ff_Tran("SAVE_EDIT");
		
	this.btn_retrieve_onclick();
}

this.ff_Vndwarn = function(vReturnSale)
{
	if (vReturnSale[5] == '8' || vReturnSale[5] == '9') 
	{
		if ( this.gf_message_chk("121982", "") != 1)
		{
			return -1;
		}
    } 
    else if (vReturnSale[5] == 'E') 
    {
    	alert(" 해당 거래처 사업자등록 번호를 확인하세요.");
    }

    return 1;
}
