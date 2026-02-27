Option Strict Off
Option Explicit On

Imports System.IO
Imports System.Runtime.InteropServices

Friend Class frmLog
    Inherits System.Windows.Forms.Form

    Const gMaxLow As Short = 30000
    Dim mMachineNumber As Integer
    Dim gGlogSearched As Boolean = False
    Dim prevGlogIndex As Integer = -1
    Public gstrLogItem As Object
    Dim dt As New DataTable()

    Private Sub chkReadMark_CheckStateChanged(ByVal eventSender As System.Object, ByVal eventArgs As System.EventArgs) Handles chkReadMark.CheckStateChanged
        frmMain.BioTime.ReadMark = chkReadMark.CheckState
    End Sub

    Private Sub ShowGlogItem(ByVal vTMachineNumber As Integer, ByVal vSEnrollNumber As Integer, ByVal vSMachineNumber As Integer, ByVal vVerifyMode As Integer, ByVal vYear As Integer, ByVal vMonth As Integer, ByVal vDay As Integer, ByVal vHour As Integer, ByVal vMinute As Integer, ByVal vSecond As Integer, ByVal vIndex As Integer, ByVal vMaxLogCnt As Integer, ByVal GrdLogData As DataGridView)
        Dim vAttStatus As Integer, vAntipass As Integer
        Dim stAttStatus As String = "", stAntipass As String = ""
        Dim vDiv As Integer = 65536

        vAntipass = vVerifyMode / vDiv
        vVerifyMode = vVerifyMode Mod vDiv
        vAttStatus = vVerifyMode / 256
        vVerifyMode = vVerifyMode Mod 256

        If vAttStatus = 0 Then
            stAttStatus = "_DutyOn"
        ElseIf vAttStatus = 1 Then
            stAttStatus = "_DutyOff"
        ElseIf vAttStatus = 2 Then
            stAttStatus = "_OverOn"
        ElseIf vAttStatus = 3 Then
            stAttStatus = "_OverOff"
        ElseIf vAttStatus = 4 Then
            stAttStatus = "_GoIn"
        ElseIf vAttStatus = 5 Then
            stAttStatus = "_GoOut"
        End If

        If vAntipass = 1 Then
            stAntipass = "(AP_In)"
        ElseIf vAntipass = 3 Then
            stAntipass = "(AP_Out)"
        End If

        Dim str_vIndex As String
        Dim str_vTMachineNumber As String
        Dim str_vSEnrollNumber As String
        Dim str_vSMachineNumber As String
        Dim str_vVerifyMode As String

        'With gridGlogData
        '    .Row = vIndex - vMaxLogCnt
        '    .Col = 0
        str_vIndex = vIndex
        '.Col = 1
        If vTMachineNumber = -1 Then
            str_vTMachineNumber = "No Photo"
        Else
            str_vTMachineNumber = CStr(vTMachineNumber)
        End If
        '.Col = 2
        str_vSEnrollNumber = CStr(vSEnrollNumber)
        '.Col = 3
        str_vSMachineNumber = CStr(vSMachineNumber)
        '.Col = 4
        vVerifyMode = vVerifyMode Mod 256
        If vVerifyMode = 1 Then
            str_vVerifyMode = "Fp"
        ElseIf vVerifyMode = 2 Then
            str_vVerifyMode = "Password"
        ElseIf vVerifyMode = 3 Then
            str_vVerifyMode = "Card"
        ElseIf vVerifyMode = 10 Then
            str_vVerifyMode = "Hand Lock"
        ElseIf vVerifyMode = 11 Then
            str_vVerifyMode = "Prog Lock"
        ElseIf vVerifyMode = 12 Then
            str_vVerifyMode = "Prog Open"
        ElseIf vVerifyMode = 13 Then
            str_vVerifyMode = "Prog Close"
        ElseIf vVerifyMode = 14 Then
            str_vVerifyMode = "Auto Recover"
        ElseIf vVerifyMode = 20 Then
            str_vVerifyMode = "Lock Over"
        ElseIf vVerifyMode = 21 Then
            str_vVerifyMode = "Illegal Open"
        ElseIf vVerifyMode = 51 Then
            str_vVerifyMode = "Fp"
        ElseIf vVerifyMode = 52 Then
            str_vVerifyMode = "Password"
        ElseIf vVerifyMode = 53 Then
            str_vVerifyMode = "Card"
        ElseIf vVerifyMode = 101 Then
            str_vVerifyMode = "Fp"
        ElseIf vVerifyMode = 102 Then
            str_vVerifyMode = "Password"
        ElseIf vVerifyMode = 103 Then
            str_vVerifyMode = "Card"
        ElseIf vVerifyMode = 151 Then
            str_vVerifyMode = "Fp"
        ElseIf vVerifyMode = 152 Then
            str_vVerifyMode = "Password"
        ElseIf vVerifyMode = 153 Then
            str_vVerifyMode = "Card"
        Else
            str_vVerifyMode = "--"
        End If

        If 1 <= vVerifyMode And vVerifyMode <= 7 Then
            str_vVerifyMode = str_vVerifyMode + stAttStatus
        ElseIf 51 <= vVerifyMode And vVerifyMode <= 53 Then
            str_vVerifyMode = str_vVerifyMode + stAttStatus
        ElseIf 101 <= vVerifyMode And vVerifyMode <= 103 Then
            str_vVerifyMode = str_vVerifyMode + stAttStatus
        ElseIf 151 <= vVerifyMode And vVerifyMode <= 153 Then
            str_vVerifyMode = str_vVerifyMode + stAttStatus
        End If

        str_vVerifyMode = str_vVerifyMode + stAntipass

        '.Col = 5
        Dim PunchTime As String
        PunchTime = CStr(vYear) & "/" & VB6.Format(vMonth, "0#") & "/" & VB6.Format(vDay, "0#") & " " & VB6.Format(vHour, "0#") & ":" & VB6.Format(vMinute, "0#")

        Dim dtrow As DataRow = dt.NewRow()
        dtrow("SrNo") = str_vIndex
        dtrow("PhotoNo") = str_vTMachineNumber
        dtrow("EnrollNo") = str_vSEnrollNumber
        dtrow("EMachineNo") = str_vSMachineNumber
        dtrow("VeriMode") = str_vVerifyMode
        dtrow("DateTime") = PunchTime
        dt.Rows.InsertAt(dtrow, 0)
        'End With
    End Sub

    Private Sub cmdAllGLogData_Click(ByVal eventSender As System.Object, ByVal eventArgs As System.EventArgs) Handles cmdAllGLogData.Click
        gGlogSearched = True

        Dim vTMachineNumber As Integer
        Dim vSMachineNumber As Integer
        Dim vSEnrollNumber As Integer
        Dim vVerifyMode As Integer
        Dim vYear As Integer
        Dim vMonth As Integer
        Dim vDay As Integer
        Dim vHour As Integer
        Dim vMinute As Integer
        Dim vSecond As Integer
        Dim vErrorCode As Integer
        Dim vRet As Boolean
        Dim i As Integer
        Dim n As Integer
        Dim vMaxLogCnt As Integer

        vMaxLogCnt = gMaxLow

        lblMessage.Text = "Waiting..."
        LabelTotal.Text = "Total : "
        System.Windows.Forms.Application.DoEvents()

        'gridSLogData.Height = VB6.TwipsToPixelsY(4800)
        'gridSLogData.Redraw = False
        'gridSLogData.Clear()
        'gridSLogData1.Top = VB6.TwipsToPixelsY(VB6.PixelsToTwipsY(gridSLogData.Top) + VB6.PixelsToTwipsY(gridSLogData.Height))
        'gridSLogData1.Height = 0
        'gridSLogData1.Redraw = False
        'gridSLogData1.Clear()
        'gridSLogData2.Top = VB6.TwipsToPixelsY(VB6.PixelsToTwipsY(gridSLogData.Top) + VB6.PixelsToTwipsY(gridSLogData.Height))
        'gridSLogData2.Height = 0
        'gridSLogData2.Redraw = False
        'gridSLogData2.Clear()

        gstrLogItem = New Object() {"SrNo", "PhotoNo", "EnrollNo", "EMachineNo", "VeriMode", "DateTime"}
        'With gridSLogData
        '    .Row = 0
        '    .set_ColWidth(0, 600)
        '    For i = 1 To 5
        '        .Col = i
        '        .Text = gstrLogItem(i)
        '        .set_ColAlignment(i, 3)
        '        .set_ColWidth(i, 1200)
        '    Next i
        '    .set_ColWidth(5, 2000)
        '    .set_ColWidth(6, 700)
        '    .set_ColWidth(7, 700)
        '    .set_ColWidth(8, 700)
        '    n = .Rows
        '    If n > 2 Then
        '        Do
        '            If n = 2 Then Exit Do
        '            .RemoveItem((n))
        '            n = n - 1
        '        Loop
        '    End If
        '.Redraw = True
        'End With
        'With gridSLogData1
        '    .Row = 0
        '    .set_ColWidth(0, 600)
        '    For i = 1 To 5
        '        .Col = i
        '        .set_ColAlignment(i, 3)
        '        .set_ColWidth(i, 1200)
        '    Next i
        '    .Col = 5
        '    .set_ColWidth(5, 2000)
        '    .set_ColWidth(6, 700)
        '    .set_ColWidth(7, 700)
        '    .set_ColWidth(8, 700)
        '    n = .Rows
        '    If n > 2 Then
        '        Do
        '            If n = 2 Then Exit Do
        '            .RemoveItem((n))
        '            n = n - 1
        '        Loop
        '    End If
        '    .Redraw = True
        'End With
        'With gridSLogData2
        '    .Row = 0
        '    .set_ColWidth(0, 600)
        '    For i = 1 To 5
        '        .Col = i
        '        .set_ColAlignment(i, 3)
        '        .set_ColWidth(i, 1200)
        '    Next i
        '    .Col = 5
        '    .set_ColWidth(5, 2000)
        '    .set_ColWidth(6, 700)
        '    .set_ColWidth(7, 700)
        '    .set_ColWidth(8, 700)
        '    n = .Rows
        '    If n > 2 Then
        '        Do
        '            If n = 2 Then Exit Do
        '            .RemoveItem((n))
        '            n = n - 1
        '        Loop
        '    End If
        '    .Redraw = True
        'End With

        Cursor = System.Windows.Forms.Cursors.WaitCursor
        vRet = frmMain.BioTime.EnableDevice(mMachineNumber, False)
        If vRet = False Then
            lblMessage.Text = gstrNoDevice
            Cursor = System.Windows.Forms.Cursors.Default
            Exit Sub
        End If

        vRet = frmMain.BioTime.ReadAllGLogData(mMachineNumber)
        If vRet = False Then
            frmMain.BioTime.GetLastError(vErrorCode)
            lblMessage.Text = ErrorPrint(vErrorCode)
        Else
            If chkAndDelete.CheckState = 1 Then
                frmMain.BioTime.EmptyGeneralLogData(mMachineNumber)
            End If
        End If

        dt = New DataTable()
        ''Create Table
        dt.Columns.Add("SrNo", GetType(String))
        dt.Columns.Add("PhotoNo", GetType(String))
        dt.Columns.Add("EnrollNo", GetType(String))
        dt.Columns.Add("EMachineNo", GetType(String))
        dt.Columns.Add("VeriMode", GetType(String))
        dt.Columns.Add("DateTime", GetType(String))

        If vRet = True Then
            lblMessage.Text = "Getting..."
            Cursor = System.Windows.Forms.Cursors.WaitCursor
            System.Windows.Forms.Application.DoEvents()
            'gridSLogData.Redraw = False
            'gridSLogData1.Redraw = False
            'gridSLogData2.Redraw = False
            'With gridSLogData
            i = 1
            Do

                vRet = frmMain.BioTime.GetAllGLogData(mMachineNumber, vTMachineNumber, vSEnrollNumber, vSMachineNumber, vVerifyMode, vYear, vMonth, vDay, vHour, vMinute, vSecond)
                If vRet = False Then Exit Do
                'If vRet = True And i <> 1 Then
                '    .AddItem(CStr(1))
                'End If

                ShowGlogItem(vTMachineNumber, vSEnrollNumber, vSMachineNumber, vVerifyMode, vYear, vMonth, vDay, vHour, vMinute, vSecond, i, 0, GrdLogData)

                LabelTotal.Text = "Total : " & i
                System.Windows.Forms.Application.DoEvents()
                i = i + 1
                'If i > vMaxLogCnt Then Exit Do
            Loop
            'End With

            'If i > vMaxLogCnt Then
            '    gridSLogData.Height = VB6.TwipsToPixelsY(VB6.PixelsToTwipsY(gridSLogData.Height) / 2)
            '    gridSLogData1.Top = VB6.TwipsToPixelsY(VB6.PixelsToTwipsY(gridSLogData.Top) + VB6.PixelsToTwipsY(gridSLogData.Height))
            '    gridSLogData1.Height = gridSLogData.Height
            '    With gridSLogData1
            '        Do
            '            vRet = frmMain.BioTime.GetGeneralLogData(mMachineNumber, vTMachineNumber, vSEnrollNumber, vSMachineNumber, vVerifyMode, vYear, vMonth, vDay, vHour, vMinute, vSecond)
            '            If vRet = False Then Exit Do
            '            If vRet = True And i <> 1 Then
            '                If i - vMaxLogCnt > 1 Then .AddItem(CStr(1))
            '            End If

            '            ShowGlogItem(vTMachineNumber, vSEnrollNumber, vSMachineNumber, vVerifyMode, vYear, vMonth, vDay, vHour, vMinute, vSecond, i, vMaxLogCnt, gridSLogData1)

            '            LabelTotal.Text = "Total : " & i
            '            System.Windows.Forms.Application.DoEvents()
            '            i = i + 1
            '            If i > vMaxLogCnt * 2 Then Exit Do
            '        Loop
            '    End With
            'End If

            'vMaxLogCnt = vMaxLogCnt * 2
            'If i > vMaxLogCnt Then
            '    gridSLogData.Height = VB6.TwipsToPixelsY(VB6.PixelsToTwipsY(gridSLogData.Height) * 2 / 3)
            '    gridSLogData1.Top = VB6.TwipsToPixelsY(VB6.PixelsToTwipsY(gridSLogData.Top) + VB6.PixelsToTwipsY(gridSLogData.Height))
            '    gridSLogData1.Height = gridSLogData.Height
            '    gridSLogData2.Top = VB6.TwipsToPixelsY(VB6.PixelsToTwipsY(gridSLogData.Top) + VB6.PixelsToTwipsY(gridSLogData.Height) * 2)
            '    gridSLogData2.Height = gridSLogData.Height
            '    With gridSLogData2
            '        Do
            '            vRet = frmMain.BioTime.GetGeneralLogData(mMachineNumber, vTMachineNumber, vSEnrollNumber, vSMachineNumber, vVerifyMode, vYear, vMonth, vDay, vHour, vMinute, vSecond)
            '            If vRet = False Then Exit Do
            '            If vRet = True And i <> 1 Then
            '                If i - vMaxLogCnt > 1 Then .AddItem(CStr(1))
            '            End If

            '            ShowGlogItem(vTMachineNumber, vSEnrollNumber, vSMachineNumber, vVerifyMode, vYear, vMonth, vDay, vHour, vMinute, vSecond, i, vMaxLogCnt, gridSLogData2)

            '            LabelTotal.Text = "Total : " & i
            '            System.Windows.Forms.Application.DoEvents()
            '            i = i + 1
            '        Loop
            '    End With
            'End If
            'gridSLogData.Redraw = True
            'gridSLogData1.Redraw = True
            'gridSLogData2.Redraw = True
            GrdLogData.DataSource = dt
            lblMessage.Text = "ReadAllGLogData OK"
        End If

        frmMain.BioTime.EnableDevice(mMachineNumber, True)
        Cursor = System.Windows.Forms.Cursors.Default
    End Sub

    Private Sub cmdEmptyGLog_Click(ByVal eventSender As System.Object, ByVal eventArgs As System.EventArgs) Handles cmdEmptyGLog.Click
        Dim vRet As Boolean
        Dim vErrorCode As Integer

        lblMessage.Text = "Working..."
        System.Windows.Forms.Application.DoEvents()

        vRet = frmMain.BioTime.EnableDevice(mMachineNumber, False)
        If vRet = False Then
            lblMessage.Text = gstrNoDevice
            Exit Sub
        End If

        vRet = frmMain.BioTime.EmptyGeneralLogData(mMachineNumber)
        If vRet = True Then
            lblMessage.Text = "EmptyGeneralLogData OK"
        Else
            frmMain.BioTime.GetLastError(vErrorCode)
            lblMessage.Text = ErrorPrint(vErrorCode)
        End If

        frmMain.BioTime.EnableDevice(mMachineNumber, True)
    End Sub

    Private Sub cmdExit_Click(ByVal eventSender As System.Object, ByVal eventArgs As System.EventArgs) Handles cmdExit.Click
        Me.Close()
    End Sub

    Private Sub cmdGlogData_Click(ByVal eventSender As System.Object, ByVal eventArgs As System.EventArgs) Handles cmdGlogData.Click
        gGlogSearched = True

        Dim vTMachineNumber As Integer
        Dim vSMachineNumber As Integer
        Dim vSEnrollNumber As Integer
        '		Dim vInOutMode As Integer
        Dim vVerifyMode As Integer
        Dim vYear As Integer
        Dim vMonth As Integer
        Dim vDay As Integer
        Dim vHour As Integer
        Dim vMinute As Integer
        Dim vSecond As Integer
        Dim vRet As Boolean
        Dim vErrorCode As Integer
        Dim i As Integer
        Dim n As Integer
        Dim vMaxLogCnt As Integer

        vMaxLogCnt = gMaxLow

        lblMessage.Text = "Waiting..."
        LabelTotal.Text = "Total : "
        System.Windows.Forms.Application.DoEvents()

        'gridSLogData.Height = VB6.TwipsToPixelsY(4800)
        'gridSLogData.Redraw = False
        'gridSLogData.Clear()
        'gridSLogData1.Top = VB6.TwipsToPixelsY(VB6.PixelsToTwipsY(gridSLogData.Top) + VB6.PixelsToTwipsY(gridSLogData.Height))
        'gridSLogData1.Height = 0
        'gridSLogData1.Redraw = False
        'gridSLogData1.Clear()
        'gridSLogData2.Top = VB6.TwipsToPixelsY(VB6.PixelsToTwipsY(gridSLogData.Top) + VB6.PixelsToTwipsY(gridSLogData.Height))
        'gridSLogData2.Height = 0
        'gridSLogData2.Redraw = False
        'gridSLogData2.Clear()

        gstrLogItem = New Object() {"SrNo", "PhotoNo", "EnrollNo", "EMachineNo", "VeriMode", "DateTime"}
        'With gridSLogData
        '    .Row = 0
        '    .set_ColWidth(0, 600)
        '    For i = 1 To 5
        '        .Col = i
        '        .Text = gstrLogItem(i)
        '        .set_ColAlignment(i, 3)
        '        .set_ColWidth(i, 1200)
        '    Next i
        '    .Col = 5
        '    .set_ColWidth(5, 2000)
        '    .set_ColWidth(6, 700)
        '    .set_ColWidth(7, 700)
        '    .set_ColWidth(8, 700)
        '    n = .Rows
        '    If n > 2 Then
        '        Do
        '            If n = 2 Then Exit Do
        '            .RemoveItem((n))
        '            n = n - 1
        '        Loop
        '    End If
        '    .Redraw = True
        'End With
        'With gridSLogData1
        '    .Row = 0
        '    .set_ColWidth(0, 600)
        '    For i = 1 To 5
        '        .Col = i
        '        .set_ColAlignment(i, 3)
        '        .set_ColWidth(i, 1200)
        '    Next i
        '    .Col = 5
        '    .set_ColWidth(5, 2000)
        '    .set_ColWidth(6, 700)
        '    .set_ColWidth(7, 700)
        '    .set_ColWidth(8, 700)
        '    n = .Rows
        '    If n > 2 Then
        '        Do
        '            If n = 2 Then Exit Do
        '            .RemoveItem((n))
        '            n = n - 1
        '        Loop
        '    End If
        '    .Redraw = True
        'End With
        'With gridSLogData2
        '    .Row = 0
        '    .set_ColWidth(0, 600)
        '    For i = 1 To 5
        '        .Col = i
        '        .set_ColAlignment(i, 3)
        '        .set_ColWidth(i, 1200)
        '    Next i
        '    .Col = 5
        '    .set_ColWidth(5, 2000)
        '    .set_ColWidth(6, 700)
        '    .set_ColWidth(7, 700)
        '    .set_ColWidth(8, 700)
        '    n = .Rows
        '    If n > 2 Then
        '        Do
        '            If n = 2 Then Exit Do
        '            .RemoveItem((n))
        '            n = n - 1
        '        Loop
        '    End If
        '    .Redraw = True
        'End With

        Cursor = System.Windows.Forms.Cursors.WaitCursor
        vRet = frmMain.BioTime.EnableDevice(mMachineNumber, False)
        If vRet = False Then
            lblMessage.Text = gstrNoDevice
            Cursor = System.Windows.Forms.Cursors.Default
            Exit Sub
        End If

        vRet = frmMain.BioTime.ReadGeneralLogData(mMachineNumber)
        If vRet = False Then
            frmMain.BioTime.GetLastError(vErrorCode)
            lblMessage.Text = ErrorPrint(vErrorCode)
        Else
            If chkAndDelete.CheckState = 1 Then
                frmMain.BioTime.EmptyGeneralLogData(mMachineNumber)
            End If
        End If

        If vRet = True Then
            Cursor = System.Windows.Forms.Cursors.WaitCursor
            lblMessage.Text = "Getting ..."
            System.Windows.Forms.Application.DoEvents()
            'gridSLogData.Redraw = False
            'gridSLogData1.Redraw = False
            'gridSLogData2.Redraw = False
            'With gridSLogData
            i = 1

            dt = New DataTable()
            ''Create Table
            dt.Columns.Add("SrNo", GetType(String))
            dt.Columns.Add("PhotoNo", GetType(String))
            dt.Columns.Add("EnrollNo", GetType(String))
            dt.Columns.Add("EMachineNo", GetType(String))
            dt.Columns.Add("VeriMode", GetType(String))
            dt.Columns.Add("DateTime", GetType(String))

            Do
                vRet = frmMain.BioTime.GetGeneralLogData(mMachineNumber, vTMachineNumber, vSEnrollNumber, vSMachineNumber, vVerifyMode, vYear, vMonth, vDay, vHour, vMinute, vSecond)
                If vRet = False Then Exit Do
                'If vRet = True And i <> 1 Then
                '    .AddItem(CStr(1))
                'End If
                '.Row = i
                '.Col = 0
                Dim str_Index As String
                Dim str_vTMachineNumber As String
                Dim str_vSEnrollNumber As String
                Dim str_vSMachineNumber As String
                Dim str_vVerifyMode As String

                str_Index = i
                '.Col = 1
                str_vTMachineNumber = CStr(vTMachineNumber)
                '.Col = 2
                str_vSEnrollNumber = CStr(vSEnrollNumber)
                '.Col = 3
                str_vSMachineNumber = CStr(vSMachineNumber)
                '.Col = 4
                vVerifyMode = vVerifyMode Mod 256
                If vVerifyMode = 1 Then
                    str_vVerifyMode = "Fp"
                ElseIf vVerifyMode = 2 Then
                    str_vVerifyMode = "Password"
                ElseIf vVerifyMode = 3 Then
                    str_vVerifyMode = "Card"
                ElseIf vVerifyMode = 10 Then
                    str_vVerifyMode = "Hand Lock"
                ElseIf vVerifyMode = 11 Then
                    str_vVerifyMode = "Prog Lock"
                ElseIf vVerifyMode = 12 Then
                    str_vVerifyMode = "Prog Open"
                ElseIf vVerifyMode = 13 Then
                    str_vVerifyMode = "Prog Close"
                ElseIf vVerifyMode = 14 Then
                    str_vVerifyMode = "Auto Recover"
                ElseIf vVerifyMode = 20 Then
                    str_vVerifyMode = "Lock Over"
                ElseIf vVerifyMode = 21 Then
                    str_vVerifyMode = "Illegal Open"
                ElseIf vVerifyMode = 51 Then
                    str_vVerifyMode = "Fp_IN"
                ElseIf vVerifyMode = 52 Then
                    str_vVerifyMode = "Password_IN"
                ElseIf vVerifyMode = 53 Then
                    str_vVerifyMode = "Card_IN"
                ElseIf vVerifyMode = 101 Then
                    str_vVerifyMode = "Fp_OUT"
                ElseIf vVerifyMode = 102 Then
                    str_vVerifyMode = "Password_OUT"
                ElseIf vVerifyMode = 103 Then
                    str_vVerifyMode = "Card_OUT"
                ElseIf vVerifyMode = 151 Then
                    str_vVerifyMode = "Fp_OT"
                ElseIf vVerifyMode = 152 Then
                    str_vVerifyMode = "Password_OT"
                ElseIf vVerifyMode = 153 Then
                    str_vVerifyMode = "Card_OT"
                Else
                    str_vVerifyMode = "--"
                End If
                '.Col = 5
                Dim PunchTime As String
                PunchTime = CStr(vYear) & "/" & VB6.Format(vMonth, "0#") & "/" & VB6.Format(vDay, "0#") & " " & VB6.Format(vHour, "0#") & ":" & VB6.Format(vMinute, "0#")

                Dim dtrow As DataRow = dt.NewRow()
                dtrow("SrNo") = str_Index
                dtrow("PhotoNo") = str_vTMachineNumber
                dtrow("EnrollNo") = str_vSEnrollNumber
                dtrow("EMachineNo") = str_vSMachineNumber
                dtrow("VeriMode") = str_vVerifyMode
                dtrow("DateTime") = PunchTime
                dt.Rows.InsertAt(dtrow, 0)

                LabelTotal.Text = "Total : " & i
                System.Windows.Forms.Application.DoEvents()
                i = i + 1
                'If i > vMaxLogCnt Then Exit Do
            Loop
            'End With

            'If i > vMaxLogCnt Then
            '    gridSLogData.Height = VB6.TwipsToPixelsY(VB6.PixelsToTwipsY(gridSLogData.Height) / 2)
            '    gridSLogData1.Top = VB6.TwipsToPixelsY(VB6.PixelsToTwipsY(gridSLogData.Top) + VB6.PixelsToTwipsY(gridSLogData.Height))
            '    gridSLogData1.Height = gridSLogData.Height
            '    With gridSLogData1
            '        Do
            '            vRet = frmMain.BioTime.GetGeneralLogData(mMachineNumber, vTMachineNumber, vSEnrollNumber, vSMachineNumber, vVerifyMode, vYear, vMonth, vDay, vHour, vMinute, vSecond)
            '            If vRet = False Then Exit Do
            '            If vRet = True And i <> 1 Then
            '                If i - vMaxLogCnt > 1 Then .AddItem(CStr(1))
            '            End If
            '            .Row = i - vMaxLogCnt
            '            .Col = 0
            '            .Text = i
            '            .Col = 1
            '            .Text = CStr(vTMachineNumber)
            '            .Col = 2
            '            .Text = CStr(vSEnrollNumber)
            '            .Col = 3
            '            .Text = CStr(vSMachineNumber)
            '            .Col = 4
            '            vVerifyMode = vVerifyMode Mod 256
            '            If vVerifyMode = 1 Then
            '                .Text = "Fp"
            '            ElseIf vVerifyMode = 2 Then
            '                .Text = "Password"
            '            ElseIf vVerifyMode = 3 Then
            '                .Text = "Card"
            '            ElseIf vVerifyMode = 10 Then
            '                .Text = "Hand Lock"
            '            ElseIf vVerifyMode = 11 Then
            '                .Text = "Prog Lock"
            '            ElseIf vVerifyMode = 12 Then
            '                .Text = "Prog Open"
            '            ElseIf vVerifyMode = 13 Then
            '                .Text = "Prog Close"
            '            ElseIf vVerifyMode = 14 Then
            '                .Text = "Auto Recover"
            '            ElseIf vVerifyMode = 20 Then
            '                .Text = "Lock Over"
            '            ElseIf vVerifyMode = 21 Then
            '                .Text = "Illegal Open"
            '            ElseIf vVerifyMode = 51 Then
            '                .Text = "Fp_IN"
            '            ElseIf vVerifyMode = 52 Then
            '                .Text = "Password_IN"
            '            ElseIf vVerifyMode = 53 Then
            '                .Text = "Card_IN"
            '            ElseIf vVerifyMode = 101 Then
            '                .Text = "Fp_OUT"
            '            ElseIf vVerifyMode = 102 Then
            '                .Text = "Password_OUT"
            '            ElseIf vVerifyMode = 103 Then
            '                .Text = "Card_OUT"
            '            ElseIf vVerifyMode = 151 Then
            '                .Text = "Fp_OT"
            '            ElseIf vVerifyMode = 152 Then
            '                .Text = "Password_OT"
            '            ElseIf vVerifyMode = 153 Then
            '                .Text = "Card_OT"
            '            Else
            '                .Text = "--"
            '            End If
            '            .Col = 5
            '            .Text = CStr(vYear) & "/" & VB6.Format(vMonth, "0#") & "/" & VB6.Format(vDay, "0#") & " " & VB6.Format(vHour, "0#") & ":" & VB6.Format(vMinute, "0#")

            '            LabelTotal.Text = "Total : " & i
            '            System.Windows.Forms.Application.DoEvents()
            '            i = i + 1
            '            If i > vMaxLogCnt * 2 Then Exit Do
            '        Loop
            '    End With
            'End If
            'vMaxLogCnt = vMaxLogCnt * 2
            'If i > vMaxLogCnt Then
            '    gridSLogData.Height = VB6.TwipsToPixelsY(VB6.PixelsToTwipsY(gridSLogData.Height) * 2 / 3)
            '    gridSLogData1.Top = VB6.TwipsToPixelsY(VB6.PixelsToTwipsY(gridSLogData.Top) + VB6.PixelsToTwipsY(gridSLogData.Height))
            '    gridSLogData1.Height = gridSLogData.Height
            '    gridSLogData2.Top = VB6.TwipsToPixelsY(VB6.PixelsToTwipsY(gridSLogData.Top) + VB6.PixelsToTwipsY(gridSLogData.Height) * 2)
            '    gridSLogData2.Height = gridSLogData.Height
            '    With gridSLogData2
            '        Do
            '            vRet = frmMain.BioTime.GetGeneralLogData(mMachineNumber, vTMachineNumber, vSEnrollNumber, vSMachineNumber, vVerifyMode, vYear, vMonth, vDay, vHour, vMinute, vSecond)
            '            If vRet = False Then Exit Do
            '            If vRet = True And i <> 1 Then
            '                If i - vMaxLogCnt > 1 Then .AddItem(CStr(1))
            '            End If
            '            .Row = i - vMaxLogCnt
            '            .Col = 0
            '            .Text = i
            '            .Col = 1
            '            .Text = CStr(vTMachineNumber)
            '            .Col = 2
            '            .Text = CStr(vSEnrollNumber)
            '            .Col = 3
            '            .Text = CStr(vSMachineNumber)
            '            .Col = 4
            '            vVerifyMode = vVerifyMode Mod 256
            '            If vVerifyMode = 1 Then
            '                .Text = "Fp"
            '            ElseIf vVerifyMode = 2 Then
            '                .Text = "Password"
            '            ElseIf vVerifyMode = 3 Then
            '                .Text = "Card"
            '            ElseIf vVerifyMode = 10 Then
            '                .Text = "Hand Lock"
            '            ElseIf vVerifyMode = 11 Then
            '                .Text = "Prog Lock"
            '            ElseIf vVerifyMode = 12 Then
            '                .Text = "Prog Open"
            '            ElseIf vVerifyMode = 13 Then
            '                .Text = "Prog Close"
            '            ElseIf vVerifyMode = 14 Then
            '                .Text = "Auto Recover"
            '            ElseIf vVerifyMode = 20 Then
            '                .Text = "Lock Over"
            '            ElseIf vVerifyMode = 21 Then
            '                .Text = "Illegal Open"
            '            ElseIf vVerifyMode = 51 Then
            '                .Text = "Fp_IN"
            '            ElseIf vVerifyMode = 52 Then
            '                .Text = "Password_IN"
            '            ElseIf vVerifyMode = 53 Then
            '                .Text = "Card_IN"
            '            ElseIf vVerifyMode = 101 Then
            '                .Text = "Fp_OUT"
            '            ElseIf vVerifyMode = 102 Then
            '                .Text = "Password_OUT"
            '            ElseIf vVerifyMode = 103 Then
            '                .Text = "Card_OUT"
            '            ElseIf vVerifyMode = 151 Then
            '                .Text = "Fp_OT"
            '            ElseIf vVerifyMode = 152 Then
            '                .Text = "Password_OT"
            '            ElseIf vVerifyMode = 153 Then
            '                .Text = "Card_OT"
            '            Else
            '                .Text = "--"
            '            End If
            '            .Col = 5
            '            .Text = CStr(vYear) & "/" & VB6.Format(vMonth, "0#") & "/" & VB6.Format(vDay, "0#") & " " & VB6.Format(vHour, "0#") & ":" & VB6.Format(vMinute, "0#")

            '            LabelTotal.Text = "Total : " & i
            '            System.Windows.Forms.Application.DoEvents()
            '            i = i + 1
            '        Loop
            '    End With
            'End If
            'gridSLogData.Redraw = True
            'gridSLogData1.Redraw = True
            'gridSLogData2.Redraw = True

            GrdLogData.DataSource = dt
            lblMessage.Text = "ReadGeneralLogData OK"
        End If

        Cursor = System.Windows.Forms.Cursors.Default
        frmMain.BioTime.EnableDevice(mMachineNumber, True)
    End Sub

    Private Sub frmLog_Load(ByVal eventSender As System.Object, ByVal eventArgs As System.EventArgs) Handles MyBase.Load
        mMachineNumber = frmMain.gMachineNumber
        chkReadMark.CheckState = System.Windows.Forms.CheckState.Checked
    End Sub

    Private Sub frmLog_FormClosed(ByVal eventSender As System.Object, ByVal eventArgs As System.Windows.Forms.FormClosedEventArgs) Handles Me.FormClosed
        '	Me.Visible = False
        frmMain.Visible = True
        ClearPhoto()
    End Sub

    Private Sub cmdSetRange_Click(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles cmdSetRange.Click
        Dim bRet As Boolean
        Dim vErrorCode As Integer
        Dim strXML As String

        lblMessage.Text = "Working..."
        Application.DoEvents()

        bRet = frmMain.BioTime.EnableDevice(mMachineNumber, False)

        If Not bRet Then
            lblMessage.Text = gstrNoDevice
            Exit Sub
        End If

        strXML = MakeXMLCommandHeader("SetGLogSearchRange")
        frmMain.BioTime.XML_AddBoolean(strXML, "UseSearchRange", chkUseSearchRange.Checked)

        If chkUseSearchRange.Checked Then
            frmMain.BioTime.XML_AddLong(strXML, "StartYear", dtStart.Value.Year)
            frmMain.BioTime.XML_AddLong(strXML, "StartMonth", dtStart.Value.Month)
            frmMain.BioTime.XML_AddLong(strXML, "StartDate", dtStart.Value.Day)
            frmMain.BioTime.XML_AddLong(strXML, "EndYear", dtEnd.Value.Year)
            frmMain.BioTime.XML_AddLong(strXML, "EndMonth", dtEnd.Value.Month)
            frmMain.BioTime.XML_AddLong(strXML, "EndDate", dtEnd.Value.Day)
        End If

        bRet = frmMain.BioTime.GeneralOperationXML(strXML)

        If bRet Then
            lblMessage.Text = "SetGLogSearchRange OK"
        Else
            frmMain.BioTime.GetLastError(vErrorCode)
            lblMessage.Text = ErrorPrint(vErrorCode)
        End If

        bRet = frmMain.BioTime.EnableDevice(mMachineNumber, True)
    End Sub

    Private Sub ClearPhoto()
        On Error Resume Next
        picGLogPhoto.Image.Dispose()
        picGLogPhoto.Image = Nothing
        picGLogPhoto.ImageLocation = ""
    End Sub

End Class