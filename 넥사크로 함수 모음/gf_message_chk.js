gf_message_chk = function (lmsgcode, sappendtxt) {
    var s_msg, s_proc, ls_gbn = "", s_msg_txt;
    var i_rtnv;
    var ret_value = new Array();

    var v_SvcAct = "Common/gf_message_chk_q.jsp";
    var in_var = "lmsgcode=" + lmsgcode + " lang=" + application.gv_lang;
    this.gf_Transaction_invar_sync("MSG", v_SvcAct, "", "", in_var, "_ff_Msg_Callback");
    ret_value = gvs_ErrorMsg.split("|");
    s_msg = ret_value[1];
    s_proc = ret_value[2];
    ls_gbn = ret_value[3];

    if (NXCore.isEmpty(s_msg)) s_msg = ' ';

    // 아규먼트 메세지
    if (NXCore.isEmpty(sappendtxt)) sappendtxt = ' ';
    else sappendtxt = '[' + this.gf_get_trans_word(sappendtxt) + ']';

    if (application.gv_lang == 'KR') {
        if (s_msg == ' ' && sappendtxt == ' ') s_msg_txt = ' ';
        else s_msg_txt = " 메 세 지  : ";

        if (gvi_ErrorCode < 0 || ret_value == "N") {
            alert("알 수 없는 메세지 입니다. 전산실에 문의하세요!  ");
            return 0;
        }
        else if (ls_gbn == 'A') {
            alert(" 코    드   : " + lmsgcode + "\n" +
                s_msg_txt + s_msg + sappendtxt + "\n\n" +
                " 처리방안 : " + s_proc);
            i_rtnv = 1;
        }
        else if (ls_gbn == 'Q') {
            i_rtnv = confirm(" 코    드   : " + lmsgcode + "\n" +
                s_msg_txt + s_msg + sappendtxt + "\n\n" +
                " 처리방안 : " + s_proc);
            if (i_rtnv) i_rtnv = 1;
            else i_rtnv = 0;
        }
    }
    else {
        if (s_msg == ' ' && sappendtxt == ' ') s_msg_txt = ' ';
        else s_msg_txt = " Messsage    : ";

        if (gvi_ErrorCode < 0 || ret_value == "N") {
            alert("Unknown message. Please contact your computing representative! ");
            return 0;
        }

        if (ls_gbn == 'A') {
            alert(" Message No. : " + lmsgcode + "\n" +
                s_msg_txt + s_msg + sappendtxt + "\n\n" +
                " Processeing : " + s_proc);
            i_rtnv = 1;
        }
        else if (ls_gbn == 'Q') {
            i_rtnv = confirm(" Message No. : " + lmsgcode + "\n" +
                s_msg_txt + s_msg + sappendtxt + "\n\n" +
                " Processing  : " + s_proc);
            if (i_rtnv) i_rtnv = 1;
            else i_rtnv = 0;
        }
    }
    /*    
        if (application.gv_lang == 'KR') {
        
            var v_SvcAct		= "Common/gf_message_chk_1q.jsp";
            var in_var = "lmsgcode=" + lmsgcode;
            this.gf_Transaction_invar_sync("MSG", v_SvcAct, "", "",in_var, "_ff_Msg_Callback");
            ret_value  = gvs_ErrorMsg.split("|");
            s_msg = ret_value[1];
            s_proc = ret_value[2];
            ls_gbn = ret_value[3];

            if (NXCore.isEmpty(s_msg) || s_msg == 'null') {
                s_msg = ' ';
            }

            if (NXCore.isEmpty(sappendtxt)) {
                sappendtxt = ' ';
            }
            else {
                sappendtxt = '[' + sappendtxt + ']';
            }
            
            if (s_msg == ' ' && sappendtxt == ' ')  
                s_msg_txt = ' ';
            else 
                s_msg_txt = " 메 세 지  : ";
            
            if  (gvi_ErrorCode < 0 || ret_value == "N") {
                      //NXCore.alert("확 인", "알 수 없는 메세지 입니다. 전산실에 문의하세요!  ", Exclamation! )
                      alert("알 수 없는 메세지 입니다. 전산실에 문의하세요!  " );
                      return -1;
             }	
             else
                 if (ls_gbn == 'A') {
    //    		 	MessageBox("확 인"," 코    드   : "+String(lmsgcode) +"~n"+&
    //    									 " 메 세 지  : " +s_msg + sappendtxt + "~n~n" +&
    //    									 " 처리방안 : "+s_proc, Information! )
                      alert(" 코    드   : "+lmsgcode +"\n"+ 
                                             s_msg_txt + s_msg + sappendtxt + "\n\n" + 
                                             " 처리방안 : "+s_proc );
                    i_rtnv = 1;
                }
                else if (ls_gbn == 'Q') {
    //    			i_rtnv = MessageBox("확 인"," 코    드   : "+String(lmsgcode) +"~n"+
    //    									 " 메 세 지  : " +s_msg + sappendtxt + "~n~n" +
    //    									 " 처리방안 : "+s_proc, Question!,  YesNo! )
                	
                    i_rtnv = confirm(" 코    드   : "+ lmsgcode +"\n"+
                                             s_msg_txt +s_msg + sappendtxt + "\n\n" +
                                             " 처리방안 : "+s_proc);
                    if (i_rtnv) i_rtnv = 1;
                    else i_rtnv = -1;
                }		
         }
        	
        if (application.gv_lang == 'CH') {
        	
             var v_SvcAct		= "Common/gf_message_chk_2q.jsp";
             var in_var = "lmsgcode=" + lmsgcode;
             this.gf_Transaction_invar_sync("MSG", v_SvcAct, "", "",in_var, "_ff_Msg_Callback");
             ret_value  = gvs_ErrorMsg.split("|");
             s_msg = ret_value[1];
             s_proc = ret_value[2];
             ls_gbn = ret_value[3];

            if (NXCore.isEmpty(s_msg) || s_msg == 'null') {
                s_msg = ' ';
            }

            if (NXCore.isEmpty(sappendtxt)) {
                sappendtxt = ' ';
            }
            else {
                sappendtxt = '[' + sappendtxt + ']';
            }
            
            if (s_msg == ' ' && sappendtxt == ' ')  
                s_msg_txt = ' ';
            else 
                s_msg_txt = " Message  : ";

                if  (gvi_ErrorCode < 0 || ret_value == "N") {
                         //MessageBox("Confirm", "UnKwon Message!  ", Exclamation! )
                              alert( "UnKwon Message!  ");
                         return -1;
                      }
                     else { 
                if (ls_gbn == 'A') {
    //    			MessageBox("Confirm"," Message Code   : "+String(lmsgcode) +"~n"+&
    //    									 " Message  : " +s_msg + sappendtxt + "~n" +&
    //    									 "                "+s_proc, Information! )
                    var msg = " Message Code: " + lmsgcode +"\n"+ s_msg_txt + s_msg + sappendtxt + "\n"+
                                              "                " + s_proc;
                        alert(msg);
                    i_rtnv = 1; 
                }
                else if (ls_gbn == 'Q') {
            	
    //    			i_rtnv = MessageBox("Confirm"," Message Code   : "+String(lmsgcode) +"~n"+&
    //    									 " Message  : " +s_msg + sappendtxt + "~n" +&
    //    									 "                "+s_proc, Question!,  YesNo! )
                	
                    i_rtnv = confirm(" Message Code   : "+lmsgcode +"\n"+
                                             s_msg_txt + s_msg + sappendtxt + "\n" +
                                             "                "+s_proc );
                    if (i_rtnv) i_rtnv = 1;
                    else i_rtnv = -1;
                }		
           }	
       }	*/
    return i_rtnv;
}