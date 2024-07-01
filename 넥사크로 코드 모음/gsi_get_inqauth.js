gsi_get_inqauth = function (arg_userid) {
    var vSql, vRtn, vLevelcd, vDeptcd, vSarea, vInqsarea, vProtect;
    var vSysman;

    var objDelete = this.removeChild("ds_select_temp_bds");
    var ds_select_temp_bds = new Dataset;
    var vi_idx = this.addChild("ds_select_temp_bds", ds_select_temp_bds);

    var vRtn2 = this.gf_SelectSql_sync("ds_select_temp_bds: Select deptcode From p1_master Where empno = '" + arg_userid + "' ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

    var vRtn = this.gf_SelectSql_sync("ds_select_temp_bds: Select substr(sarea,1,2) From sarea Where deptcode = '" + vRtn2[1] + "' group by substr(sarea,1,2) ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

    var vJiwon = this.gf_Getsyscnfg('S', 14, '01');

    var vRtn5 = this.gf_SelectSql_sync("ds_select_temp_bds: Select rfna1 From reffpf Where rfgub <> '00' and rfcod = '1O' and rfna3 = '" + arg_userid + "'  ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

    var vEtc = vRtn5[1];

    if (!NXCore.isEmpty(vEtc) && vEtc != '') {
        //	if(vRtn2[1].substr(0,2) != 'P3')
        //	{
        vRtn2[1] = vJiwon;
        //	}
    }

    if (vRtn2[1] != vJiwon && vRtn2[1] != 'P125000' && vRtn[1] == '08')//해외영업
    {

        var objDelete = this.removeChild("ds_select_temp_bds");
        var ds_select_temp_bds = new Dataset;
        var vi_idx = this.addChild("ds_select_temp_bds", ds_select_temp_bds);

        vSql = "Select DISTINCT DECODE(B.EMPNO, NULL, A.JOBKINDCODE, B.LEVELCODE) LEVELCD,  "
            + "       DECODE(B.DEPTCODE, NULL, A.DEPTCODE, B.DEPTCODE) DEPTCD,   "
            + "       DECODE(E.SAREA, NULL, E.SAREA, E.SAREA) SAREA,            "
            + "       DECODE(B.EMPNO, NULL, A.JOBKINDCODE, B.LEVELCODE2) LEVELCD2, "
            + "       DECODE(B.DEPTCODE, NULL, A.DEPTCODE, B.DEPTCODE2) DEPTCD2,  "
            + "       DECODE(E.SAREA, NULL, E.SAREA, E.SAREA)  SAREA2, NVL(C.SYSMAN,'N') AS SYSMAN          "
            + "  From P1_MASTER A, ANAL_CUST_LEVEL B, LOGIN_T C, SAREA D, VNDMST_SUB E  "
            + " Where C.L_USERID = '" + arg_userid + "'"
            + "   And C.L_USERID = B.EMPNO(+) "
            + "   And C.L_EMPNO  = A.EMPNO    "
            + "   And E.SAREA = D.SAREA(+) "
            + "   And A.EMPNO = E.SALE_EMP(+) AND D.USEYN = 'Y'";
        vSql = "ds_select_temp_bds : " + vSql;

        // trace(vSql);

        this.gf_SelectSql_sync(vSql, "SELECT_INQAUTH", "gsi_Callback_sync", 0);

        if (gvi_ErrorCode < 0) {
            return;
        }

        if (ds_select_temp_bds.rowcount == 0) {
            alert("불완전한 user id 입니다.");
            return;
        }

        vProtect = 'N';
        vLevelcd = ds_select_temp_bds.getColumn(0, "LEVELCD");
        vDeptcd = ds_select_temp_bds.getColumn(0, "DEPTCD");
        vSarea = ds_select_temp_bds.getColumn(0, "SAREA");


        if (vLevelcd == '00') {
            vInqdept = '%';
            vInqsarea = '%';
            vSarea = '%';
        }
        else
            /// 25:지사장, 41:소장, 45:지점장, 50:팀장
            if (vLevelcd == '25' || vLevelcd == '41') {
                vInqdept = vDeptcd.substr(0, 4) + '%';
                vInqsarea = vSarea.substr(0, 2) + '%';
            }
            else
                if (vLevelcd == '45') {
                    vInqdept = vDeptcd.substr(0, 5) + '%';
                    vInqsarea = vSarea.substr(0, 3) + '%';
                }
                else
                    if (vLevelcd == '50') {
                        vInqdept = vDeptcd;
                        vInqsarea = vSarea;
                    }
                    else {
                        vInqdept = vDeptcd;
                        vInqsarea = vSarea;
                        vProtect = 'Y';
                    }

        var vReturn = new Array();
        vReturn[0] = '1';
        vReturn[1] = vLevelcd;
        vReturn[2] = vDeptcd;
        vReturn[3] = vInqdept;
        vReturn[4] = vSarea;
        vReturn[5] = vInqsarea;
        vReturn[6] = vProtect;

        vLevelcd = ds_select_temp_bds.getColumn(0, "LEVELCD2");
        vDeptcd = ds_select_temp_bds.getColumn(0, "DEPTCD2");
        vSarea = ds_select_temp_bds.getColumn(0, "SAREA2");

        if (ds_select_temp_bds.rowcount > 1) // 담당엽업팀 2개인경우..
        {
            vSarea = ds_select_temp_bds.getColumn(1, "SAREA");
        }

        if (vLevelcd == '' || vLevelcd == null)
            vLevelcd = ' ';

        if (vDeptcd == '' || vDeptcd == null)
            vDeptcd = ' ';

        if (vSarea == '' || vSarea == null)
            vSarea = ' ';

        if (vLevelcd == '00') {
            vInqdept = '%';
            vInqsarea = '%'
        }
        else
            /// 25:지사장, 41:소장, 45:지점장, 50:팀장
            if (vLevelcd == '25' || vLevelcd == '41') {
                vInqdept = vDeptcd.substr(0, 4) + '%';
                vInqsarea = vSarea.substr(0, 2) + '%';
            }
            else
                if (vLevelcd == '45') {
                    vInqdept = vDeptcd.substr(0, 5) + '%';
                    vInqsarea = vSarea.substr(0, 3) + '%';
                }
                else
                    if (vLevelcd == '50') {
                        vInqdept = vDeptcd;
                        vInqsarea = vSarea;
                    }
                    else {
                        vInqdept = vDeptcd;
                        vInqsarea = vSarea;
                    }


        vReturn[7] = vLevelcd;
        vReturn[8] = vDeptcd;
        vReturn[9] = vInqdept;
        vReturn[10] = vSarea;
        vReturn[11] = vInqsarea;


        // 2017.11.21 KSM 추가 .
        vSysman = ds_select_temp_bds.getColumn(0, "SYSMAN");

        vReturn[12] = vSysman;
        var objDelete = this.removeChild("ds_select_temp_bds");
    }
    else if (vRtn2[1] == 'P125000' && vRtn[1] != '08' && vRtn2[1] != vJiwon)//물류관리팀
    {
        var objDelete = this.removeChild("ds_select_temp_bds");
        var ds_select_temp_bds = new Dataset;
        var vi_idx = this.addChild("ds_select_temp_bds", ds_select_temp_bds);

        vSql = "Select DECODE(B.EMPNO, NULL, A.JOBKINDCODE, B.LEVELCODE) LEVELCD,  "
            + "       DECODE(B.DEPTCODE, NULL, A.DEPTCODE, B.DEPTCODE) DEPTCD,   "
            + "       DECODE(B.SAREA, NULL, D.SAREA, B.SAREA) SAREA,            "
            + "       DECODE(B.EMPNO, NULL, A.JOBKINDCODE, B.LEVELCODE2) LEVELCD2, "
            + "       DECODE(B.DEPTCODE, NULL, A.DEPTCODE, B.DEPTCODE2) DEPTCD2,  "
            + "       DECODE(B.SAREA, NULL, D.SAREA, B.SAREA2)  SAREA2, NVL(C.SYSMAN,'N') AS SYSMAN          "
            + "  From P1_MASTER A, ANAL_CUST_LEVEL B, LOGIN_T C, SAREA D  "
            + " Where C.L_USERID = '" + arg_userid + "'"
            + "   And C.L_USERID = B.EMPNO(+) "
            + "   And C.L_EMPNO  = A.EMPNO    "
            + "   And A.DEPTCODE = D.DEPTCODE(+) ";
        vSql = "ds_select_temp_bds : " + vSql;

        // trace(vSql);

        this.gf_SelectSql_sync(vSql, "SELECT_INQAUTH", "gsi_Callback_sync", 0);

        if (gvi_ErrorCode < 0) {
            return;
        }

        if (ds_select_temp_bds.rowcount == 0) {
            alert("불완전한 user id 입니다.");
            return;
        }

        vProtect = 'N';
        vLevelcd = ds_select_temp_bds.getColumn(0, "LEVELCD");
        vDeptcd = ds_select_temp_bds.getColumn(0, "DEPTCD");
        vSarea = ds_select_temp_bds.getColumn(0, "SAREA");



        if (vLevelcd == '00') {
            vInqdept = '%';
            vInqsarea = '%';
            vSarea = '%';
        }
        else
            /// 25:지사장, 41:소장, 45:지점장, 50:팀장
            if (vLevelcd == '25' || vLevelcd == '41') {
                vInqdept = vDeptcd.substr(0, 4) + '%';
                vInqsarea = vSarea.substr(0, 2) + '%';
            }
            else
                if (vLevelcd == '45') {
                    vInqdept = vDeptcd.substr(0, 6) + '%';
                    vInqsarea = vSarea.substr(0, 4) + '%';
                }
                else
                    if (vLevelcd == '50') {
                        vInqdept = vDeptcd;
                        vInqsarea = vSarea;
                    }
                    else {
                        vInqdept = vDeptcd;
                        vInqsarea = vSarea;
                        vProtect = 'Y';
                    }

        var vReturn = new Array();
        vReturn[0] = '1';
        vReturn[1] = vLevelcd;
        vReturn[2] = vDeptcd;
        vReturn[3] = vInqdept;
        vReturn[4] = '%';
        vReturn[5] = vInqsarea;
        vReturn[6] = vProtect;

        vLevelcd = ds_select_temp_bds.getColumn(0, "LEVELCD2");
        vDeptcd = ds_select_temp_bds.getColumn(0, "DEPTCD2");
        vSarea = ds_select_temp_bds.getColumn(0, "SAREA2");

        if (vLevelcd == '' || vLevelcd == null)
            vLevelcd = ' ';

        if (vDeptcd == '' || vDeptcd == null)
            vDeptcd = ' ';

        if (vSarea == '' || vSarea == null)
            vSarea = ' ';

        if (vLevelcd == '00') {
            vInqdept = '%';
            vInqsarea = '%'
        }
        else
            /// 25:지사장, 41:소장, 45:지점장, 50:팀장
            if (vLevelcd == '25' || vLevelcd == '41') {
                vInqdept = vDeptcd.substr(0, 4) + '%';
                vInqsarea = vSarea.substr(0, 2) + '%';
            }
            else
                if (vLevelcd == '45') {
                    vInqdept = vDeptcd.substr(0, 5) + '%';
                    vInqsarea = vSarea.substr(0, 3) + '%';
                }
                else
                    if (vLevelcd == '50') {
                        vInqdept = vDeptcd;
                        vInqsarea = vSarea;
                    }
                    else {
                        vInqdept = vDeptcd;
                        vInqsarea = vSarea;
                    }

        vReturn[7] = vLevelcd;
        vReturn[8] = vDeptcd;
        vReturn[9] = vInqdept;
        vReturn[10] = vSarea;
        vReturn[11] = vInqsarea;


        // 2017.11.21 KSM 추가 .
        vSysman = ds_select_temp_bds.getColumn(0, "SYSMAN");

        vReturn[12] = vSysman;
        var objDelete = this.removeChild("ds_select_temp_bds");
    }
    else if (vRtn2[1] != 'P125000' && vRtn[1] != '08' && vRtn2[1] != vJiwon) //국내영업
    {
        var objDelete = this.removeChild("ds_select_temp_bds");
        var ds_select_temp_bds = new Dataset;
        var vi_idx = this.addChild("ds_select_temp_bds", ds_select_temp_bds);

        vSql = "Select DECODE(B.EMPNO, NULL, A.JOBKINDCODE, B.LEVELCODE) LEVELCD,  "
            + "       DECODE(B.DEPTCODE, NULL, A.DEPTCODE, B.DEPTCODE) DEPTCD,   "
            + "       DECODE(B.SAREA, NULL, D.SAREA, B.SAREA) SAREA,            "
            + "       DECODE(B.EMPNO, NULL, A.JOBKINDCODE, B.LEVELCODE2) LEVELCD2, "
            + "       DECODE(B.DEPTCODE, NULL, A.DEPTCODE, B.DEPTCODE2) DEPTCD2,  "
            + "       DECODE(B.SAREA, NULL, D.SAREA, B.SAREA2)  SAREA2, NVL(C.SYSMAN,'N') AS SYSMAN          "
            + "  From P1_MASTER A, ANAL_CUST_LEVEL B, LOGIN_T C, SAREA D  "
            + " Where C.L_USERID = '" + arg_userid + "'"
            + "   And C.L_USERID = B.EMPNO(+) "
            + "   And C.L_EMPNO  = A.EMPNO    "
            + "   And A.DEPTCODE = D.DEPTCODE(+) ";
        vSql = "ds_select_temp_bds : " + vSql;

        // trace(vSql);
        this.gf_SelectSql_sync(vSql, "SELECT_INQAUTH", "gsi_Callback_sync", 0);

        if (gvi_ErrorCode < 0) {
            return;
        }

        if (ds_select_temp_bds.rowcount == 0) {
            alert("불완전한 user id 입니다.");
            return;
        }

        vProtect = 'N';
        vLevelcd = ds_select_temp_bds.getColumn(0, "LEVELCD");
        vDeptcd = ds_select_temp_bds.getColumn(0, "DEPTCD");
        vSarea = ds_select_temp_bds.getColumn(0, "SAREA");



        if (vLevelcd == '00') {
            vInqdept = '%';
            vInqsarea = '%';
            vSarea = '%';
        }
        else
            /// 25:지사장, 41:소장, 45:지점장, 50:팀장
            if (vLevelcd == '25' || vLevelcd == '41') {
                vInqdept = vDeptcd.substr(0, 4) + '%';
                vInqsarea = vSarea.substr(0, 2) + '%';
            }
            else
                if (vLevelcd == '45') {
                    vInqdept = vDeptcd.substr(0, 6) + '%';
                    vInqsarea = vSarea.substr(0, 4) + '%';
                }
                else
                    if (vLevelcd == '50') {
                        vInqdept = vDeptcd;
                        vInqsarea = vSarea;
                    }
                    else {
                        vInqdept = vDeptcd;
                        vInqsarea = vSarea;
                        vProtect = 'Y';
                    }

        var vReturn = new Array();
        vReturn[0] = '1';
        vReturn[1] = vLevelcd;
        vReturn[2] = vDeptcd;
        vReturn[3] = vInqdept;
        vReturn[4] = vSarea;
        vReturn[5] = vInqsarea;
        vReturn[6] = vProtect;

        vLevelcd = ds_select_temp_bds.getColumn(0, "LEVELCD2");
        vDeptcd = ds_select_temp_bds.getColumn(0, "DEPTCD2");
        vSarea = ds_select_temp_bds.getColumn(0, "SAREA2");

        if (vLevelcd == '' || vLevelcd == null)
            vLevelcd = ' ';

        if (vDeptcd == '' || vDeptcd == null)
            vDeptcd = ' ';

        if (vSarea == '' || vSarea == null)
            vSarea = ' ';

        if (vLevelcd == '00') {
            vInqdept = '%';
            vInqsarea = '%'
        }
        else
            /// 25:지사장, 41:소장, 45:지점장, 50:팀장
            if (vLevelcd == '25' || vLevelcd == '41') {
                vInqdept = vDeptcd.substr(0, 4) + '%';
                vInqsarea = vSarea.substr(0, 2) + '%';
            }
            else
                if (vLevelcd == '45') {
                    vInqdept = vDeptcd.substr(0, 5) + '%';
                    vInqsarea = vSarea.substr(0, 3) + '%';
                }
                else
                    if (vLevelcd == '50') {
                        vInqdept = vDeptcd;
                        vInqsarea = vSarea;
                    }
                    else {
                        vInqdept = vDeptcd;
                        vInqsarea = vSarea;
                    }

        vReturn[7] = vLevelcd;
        vReturn[8] = vDeptcd;
        vReturn[9] = vInqdept;
        vReturn[10] = vSarea;
        vReturn[11] = vInqsarea;


        // 2017.11.21 KSM 추가 .
        vSysman = ds_select_temp_bds.getColumn(0, "SYSMAN");

        vReturn[12] = vSysman;
        var objDelete = this.removeChild("ds_select_temp_bds");
    }
    else {
        var vReturn = new Array();
        vReturn[0] = '1';
        vReturn[1] = '00';
        vReturn[2] = '%';
        vReturn[3] = '%';
        vReturn[4] = '%';
        vReturn[5] = '%';
        vReturn[6] = 'Y';
        vReturn[7] = '00';
        vReturn[8] = '%';
        vReturn[9] = '%';
        vReturn[10] = '%';
        vReturn[11] = '%';
        vReturn[12] = 'Y';
    }

    if (arg_userid == 'ref') {
        var vReturn = new Array();
        vReturn[0] = '1';
        vReturn[1] = '00';
        vReturn[2] = '%';
        vReturn[3] = '%';
        vReturn[4] = '%';
        vReturn[5] = '%';
        vReturn[6] = 'Y';
        vReturn[7] = '00';
        vReturn[8] = '%';
        vReturn[9] = '%';
        vReturn[10] = '%';
        vReturn[11] = '%';
        vReturn[12] = 'Y';
    }

    return vReturn;
}