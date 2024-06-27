<%@ include file = "../../include/top_tr.jsp" %>
<%
	//-----------------�ƱԸ�Ʈ----------�ּ�â�� .jsp?arg_tag='1' �� ���--- 
	//   String arg_tag = request.getParameter("arg_tag");                    
	//------------------------------------------------------------------------
  
	DataSet in_com = in_ds;

	//�߰�, ������ �ڷ� ó�� ����
	for(int i=0; i < nUpdInsRowCnt; i++){
		//������ �ڷ� ó��
		if(in_com.getRowType(i) == DataSet.ROW_TYPE_UPDATED){
			SQL  = " UPDATE IMHIST_SAL ";
			SQL += "    SET IO_CONFIRM = ? ";
			SQL += "      , IO_DATE = ? ";
			SQL += "      , IO_EMPNO = ? ";
			SQL += "  WHERE IOJPNO LIKE ? ";

			pstmt = conn.prepareStatement(SQL);
			pstmt.setString(1,  in_com.getString(i, "IO_CONFIRM"));
			pstmt.setString(2,  in_com.getString(i, "IO_DATE"));
			pstmt.setString(3,  in_com.getString(i, "IO_EMPNO"));
			pstmt.setString(4,  in_com.getString(i, "IOJPNO") + "%");
			intRow = pstmt.executeUpdate();
			pstmt.close();
		}

	}  // end for
	
	in_com = in_ds2;

	
%>
<%@ include file = "../../include/buttom_tr.jsp" %>
