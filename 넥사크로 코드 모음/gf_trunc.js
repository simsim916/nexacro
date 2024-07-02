gf_trunc = function (nNum, nPos) {
    var half = 0.5;
    var factor = 1;
    var i;

    var nRemain_temp = 0;
    var nRemain = 0;
    var nRemain2 = 0;

    var nTemp, nTemp2, nTemp3, nTemp4;

    var nPow = Math.pow(10, nPos);
    var nPow2 = Math.pow(10, nPos + 1);   ///// 소수점 이상으로 한번 가공함...(2009.09.30)

    nNum = parseFloat(nNum);

    ////alert('원숫자1:' + nNum);

    if (nNum <= 0 || nNum < 0) {
        nNum = nNum * -1;

        //----------------------------------------------
        //// 소수점 반올림이 되는 대상 바로 밑에서
        //// 절사한다...
        //----------------------------------------------
        ////nTemp = Math.floor(nNum * nPow2) / nPow2; //// 2010.01.03 사용하지 않음

        ////2010.01.03 1이 0.999999....로 표현되는 것을 보정하기 위한 작업
        //// (2010.01.06 수정(0.1을 더했던 것을 0.001로 수정))
        nTemp = Math.floor((nNum * nPow2) + 0.001) / (nPow2);

        nTemp2 = nTemp * -1;
    }
    else {
        //----------------------------------------------
        //// 소수점 반올림이 되는 대상 바로 밑에서
        //// 절사한다...
        //----------------------------------------------
        ////nTemp = Math.floor(nNum * nPow2) / nPow2; //// 2010.01.03 사용하지 않음

        ////2010.01.03 1이 0.999999....로 표현되는 것을 보정하기 위한 작업
        nTemp = Math.floor((nNum * nPow2) + 0.001) / (nPow2);

        ////alert('계산임시' + Math.floor(nNum * nPow2));

        nTemp2 = nTemp;
    }

    //-----------------------------------------------
    //// 소수 반올림 대상이 되는 밑의 자리에서
    //// 0.5이상이 되는 것은 반올림을 한다...
    //-----------------------------------------------
    for (i = 0; i <= nPos; i++) {
        //--------------------------
        //// 첫번째는 제외한다...
        //--------------------------
        half *= 0.1;

        factor *= 10;
    }

    //----------------------------------------------
    //// 소수점 반올림이 되는 대상으로 처리한다...
    //----------------------------------------------
    if (nTemp2 <= 0 || nTemp2 < 0)  //// 음수일 경우
    {
        nTemp2 = nTemp2 * -1;

        ////nRemain = nTemp2 * nPow2 % 10;  //// 2009.12.28 comment 처리
        ////nRemain = Math.round(nTemp2 * nPow2) % 10;  //// 2009.12.28 처리
        nRemain = Math.floor((nTemp2 * nPow2) + 0.001) % 10;  //// 2010.01.04 처리

        //18.05.04 절사처리 위해 반올림로직 주석처리
        // 		if (nRemain >= 5)
        // 		{
        // 			///// nTemp3 = parseInt((nTemp2 + (half * 10)) * factor) / factor;  //// 반올림 처리
        // 			nTemp3 = parseInt(nTemp2 * factor) / factor;   //// 절사 처리
        // 			////nRemain2 = nTemp3 * nPow2 % 10;  //// 2009.12.28 comment 처리
        // 			////nRemain2 = Math.round(nTemp3 * nPow2) % 10;   //// 2009.12.28 처리 2010.01.04 COMMENT 처리
        // 			nRemain2 = Math.floor((nTemp3 * nPow2) + 0.001) % 10;   //// 2009.12.28 처리
        // 			if (nRemain2 >= 5)
        // 			{
        // 				//// nTemp4 = parseInt((nTemp3 + (half * 10)) * factor) / factor;   //// 반올림 처리
        // 				nTemp4 = parseInt(nTemp3 * factor) / factor;  //// 절사 처리
        // 				//// nTemp4 = Math.floor(Math.round(nTemp4 * nPow * 10) / 10) / nPow;    /// 0.9999로 표현되는 것 때문에 수정(2009.10.21)
        // 				//// alert('계산2 : ' + nTemp4);
        // 				nTemp4 = Math.floor((nTemp4 * nPow) + 0.001) / nPow;    /// 0.9999로 표현되는 것 때문에 수정(2009.10.21)	
        // 			}
        // 			else
        // 			{
        // 				////nTemp4 = Math.round(nTemp3 * nPow) / nPow;   ////  2010.01.04 COMMENT 처리
        // 				nTemp4 = Math.floor((nTemp3 * nPow) + 0.001) / nPow; //// 2010.01.04 처리
        // 			}
        // 		}
        // 		else
        // 		{
        ////nTemp4 = Math.round(nTemp2 * nPow) / nPow;
        nTemp4 = Math.floor((nTemp2 * nPow) + 0.001) / nPow;   //// 2010.01.04 처리
        //}

        nTemp4 = nTemp4 * -1;
    }
    else //// 양수일 경우
    {
        ////alert('원숫자2:' + nTemp2);

        ////nRemain = nTemp2 * nPow2 % 10;  //// 2009.12.28 comment 처리...

        //nRemain = Math.round((nTemp2 * nPow2 * 10) / 10) % 10;  //// 2009.12.28 수정
        nRemain = Math.floor((nTemp2 * nPow2) + 0.001) % 10;  //// 2009.01.04 수정

        ////alert( Math.round(nTemp2 * nPow2) + '/' + nTemp2 + '아래 자리수 나머지' + nRemain);

        //18.05.04 절사처리 위해 반올림로직 주석처리
        // 		if (nRemain >= 5)
        // 		{
        // 			//// nTemp3 = parseInt((nTemp2 + (half * 10)) * factor) / factor;   //// 반올림 처리
        // 			nTemp3 = parseInt(nTemp2 * factor) / factor;   //// 절사 처리
        // 
        // 			////alert('계산금액1 : ' + nTemp3);
        // 			
        // 			nRemain2 = Math.floor((nTemp3 * nPow2) + 0.001) % 10;
        // 			
        // 			////alert('잔액2:' + nRemain2);
        // 			
        // 			if (nRemain2 >= 5)
        // 			{
        // 				///// nTemp4 = parseInt((nTemp3 + (half * 10)) * factor) / factor;   //// 반올림 처리
        // 				nTemp4 = parseInt(nTemp3 * factor) / factor;   ///// 절사 처리
        // 			
        // 				nTemp4 = Math.floor((nTemp4 * nPow) + 0.001) / nPow;    /// 0.9999로 표현되는 것 때문에 수정(2009.10.21)
        // 			}
        // 			else
        // 			{
        // 				////nTemp4 = Math.round(nTemp3 * nPow) / nPow;
        // 				nTemp4 = Math.floor((nTemp3 * nPow) + 0.001) / nPow;
        // 			}
        // 		}
        // 		else
        // 		{
        ////nTemp4 = Math.round(nTemp2 * nPow) / nPow; //// 2009.01.04 COMMNET 처리
        nTemp4 = Math.floor((nTemp2 * nPow) + 0.001) / nPow;   //// 2009.01.04
        //}
    }

    return nTemp4;
}