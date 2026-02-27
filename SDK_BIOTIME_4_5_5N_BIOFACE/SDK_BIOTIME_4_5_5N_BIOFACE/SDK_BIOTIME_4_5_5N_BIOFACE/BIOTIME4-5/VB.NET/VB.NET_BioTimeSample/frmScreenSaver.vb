Public Class frmScreenSaver

    Public Const SLEEP_MSG_LEN As Integer = 128 * 2 'Sleep Message can be 128 characters of UNICODE
    Public Const COMPANY_NAME_LEN As Integer = 64 * 2 ' Company Name can be 64 characters of UNICODE
    Public Const CUSTOMER_NAME_LEN As Integer = 64 * 2 ' Customer Name can be 64 characters of UNICODE

    Private Sub cmdGetGlyphSize_Click(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles cmdGetGlyphSize.Click
        Dim bRet As Boolean
        Dim vErrorCode As Integer = 0
        Dim strXML As String

        lblMessage.Text = "Working..."
        Application.DoEvents()

        bRet = frmMain.BioTime.EnableDevice(frmMain.gMachineNumber, False)

        If Not bRet Then
            lblMessage.Text = gstrNoDevice
            Exit Sub
        End If

        strXML = MakeXMLCommandHeader("GetSleepMsgGlyphSize")
        bRet = frmMain.BioTime.GeneralOperationXML(strXML)

        If bRet Then
            lblMessage.Text = "GetSleepMsgGlyphSize OK"
            txtGlyphWidth.Text = frmMain.BioTime.XML_ParseInt(strXML, "Width")
            txtGlyphHeight.Text = frmMain.BioTime.XML_ParseInt(strXML, "Height")
        Else
            frmMain.BioTime.GetLastError(vErrorCode)
            lblMessage.Text = ErrorPrint(vErrorCode)
        End If

        bRet = frmMain.BioTime.EnableDevice(frmMain.gMachineNumber, True)
    End Sub

    Private Sub frmScreenSaver_FormClosing(ByVal sender As System.Object, ByVal e As System.Windows.Forms.FormClosingEventArgs) Handles MyBase.FormClosing
        frmMain.Visible = True
    End Sub

    Private Sub cmdExit_Click(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles cmdExit.Click
        Close()
    End Sub

    Private Sub cmdGetCustomerInfo_Click(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles cmdGetCustomerInfo.Click
        Dim bRet As Boolean
        Dim vErrorCode As Integer = 0
        Dim strXML As String
        Dim strCompanyName As String = "", strCustomerName As String = ""

        lblMessage.Text = "Working..."
        Application.DoEvents()

        bRet = frmMain.BioTime.EnableDevice(frmMain.gMachineNumber, False)

        If Not bRet Then
            lblMessage.Text = gstrNoDevice
            Exit Sub
        End If

        strXML = MakeXMLCommandHeader("GetCustomerInfo")

        bRet = frmMain.BioTime.GeneralOperationXML(strXML)

        If bRet Then
            lblMessage.Text = "GetCustomerInfo OK"
            frmMain.BioTime.XML_ParseBinaryUnicode(strXML, "CompanyName", strCompanyName, COMPANY_NAME_LEN)
            frmMain.BioTime.XML_ParseBinaryUnicode(strXML, "CustomerName", strCustomerName, CUSTOMER_NAME_LEN)

            txtCompanyName.Text = strCompanyName
            txtCustomerName.Text = strCustomerName
        Else
            frmMain.BioTime.GetLastError(vErrorCode)
            lblMessage.Text = ErrorPrint(vErrorCode)
        End If

        bRet = frmMain.BioTime.EnableDevice(frmMain.gMachineNumber, True)
    End Sub

    Private Sub cmdSetCustomerInfo_Click(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles cmdSetCustomerInfo.Click
        Dim bRet As Boolean
        Dim vErrorCode As Integer = 0
        Dim strXML As String

        lblMessage.Text = "Working..."
        Application.DoEvents()

        bRet = frmMain.BioTime.EnableDevice(frmMain.gMachineNumber, False)

        If Not bRet Then
            lblMessage.Text = gstrNoDevice
            Exit Sub
        End If

        strXML = MakeXMLCommandHeader("SetCustomerInfo")
        frmMain.BioTime.XML_AddBinaryUnicode(strXML, "CompanyName", txtCompanyName.Text)
        frmMain.BioTime.XML_AddBinaryUnicode(strXML, "CustomerName", txtCustomerName.Text)

        bRet = frmMain.BioTime.GeneralOperationXML(strXML)

        If bRet Then
            lblMessage.Text = "SetCustomerInfo OK"
        Else
            frmMain.BioTime.GetLastError(vErrorCode)
            lblMessage.Text = ErrorPrint(vErrorCode)
        End If

        bRet = frmMain.BioTime.EnableDevice(frmMain.gMachineNumber, True)
    End Sub

    Private Sub cmdGetSleepMsg_Click(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles cmdGetSleepMsg.Click
        Dim bRet As Boolean
        Dim vErrorCode As Integer = 0
        Dim strXML As String
        Dim strSleepMessage As String = ""

        lblMessage.Text = "Working..."
        Application.DoEvents()

        bRet = frmMain.BioTime.EnableDevice(frmMain.gMachineNumber, False)

        If Not bRet Then
            lblMessage.Text = gstrNoDevice
            Exit Sub
        End If

        strXML = MakeXMLCommandHeader("GetSleepMessage")

        bRet = frmMain.BioTime.GeneralOperationXML(strXML)

        If bRet Then
            lblMessage.Text = "GetSleepMessage OK"
            frmMain.BioTime.XML_ParseBinaryUnicode(strXML, "SleepMessage", strSleepMessage, SLEEP_MSG_LEN)

            txtSleepMessage.Text = strSleepMessage
        Else
            frmMain.BioTime.GetLastError(vErrorCode)
            lblMessage.Text = ErrorPrint(vErrorCode)
        End If

        bRet = frmMain.BioTime.EnableDevice(frmMain.gMachineNumber, True)
    End Sub

    Private Sub cmdSetSleepMsg_Click(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles cmdSetSleepMsg.Click
        Dim bRet As Boolean
        Dim vErrorCode As Integer = 0
        Dim strXML As String
        Dim strFontXML As String = ""

        Dim glyphWidth As Integer, glyphHeight As Integer
        Dim fontHeight As Integer, fontWidth As Integer, fontWeight As Integer

        lblMessage.Text = "Working..."
        Application.DoEvents()

        bRet = frmMain.BioTime.EnableDevice(frmMain.gMachineNumber, False)

        If Not bRet Then
            lblMessage.Text = gstrNoDevice
            Exit Sub
        End If

        strXML = MakeXMLCommandHeader("GetSleepMsgGlyphSize")

        bRet = frmMain.BioTime.GeneralOperationXML(strXML)
        If Not bRet Then
            frmMain.BioTime.GetLastError(vErrorCode)
            lblMessage.Text = ErrorPrint(vErrorCode)
            GoTo _lExit
        End If

        glyphWidth = frmMain.BioTime.XML_ParseInt(strXML, "Width")
        glyphHeight = frmMain.BioTime.XML_ParseInt(strXML, "Height")
        fontHeight = Val(txtFontHeight.Text)
        fontWidth = Val(txtFontWidth.Text)
        fontWeight = Val(txtFontWeight.Text)


        frmMain.BioTime.XML_AddString(strFontXML, "FaceName", "Arial")
        frmMain.BioTime.XML_AddInt(strFontXML, "Height", fontHeight)
        frmMain.BioTime.XML_AddInt(strFontXML, "Width", fontWidth)
        frmMain.BioTime.XML_AddInt(strFontXML, "Weight", fontWeight)
        frmMain.BioTime.XML_AddBoolean(strFontXML, "Italic", chkItalic.Checked)
        frmMain.BioTime.XML_AddBoolean(strFontXML, "Underline", chkUnderline.Checked)
        frmMain.BioTime.XML_AddBoolean(strFontXML, "StrikeOut", chkStrikeOut.Checked)

        If chkDebugOut.Checked And txtDebugOutFile.Text <> "" Then
            frmMain.BioTime.XML_AddString(strFontXML, "DebugOut", txtDebugOutFile.Text)
        End If

        strXML = MakeXMLCommandHeader("SetSleepMessage")
        frmMain.BioTime.XML_AddBinaryGlyph(strXML, txtSleepMessage.Text, glyphWidth, glyphHeight, strFontXML)

        bRet = frmMain.BioTime.GeneralOperationXML(strXML)

        If bRet Then
            lblMessage.Text = "SetSleepMessage OK"
        Else
            frmMain.BioTime.GetLastError(vErrorCode)
            lblMessage.Text = ErrorPrint(vErrorCode)
        End If

_lExit:
        bRet = frmMain.BioTime.EnableDevice(frmMain.gMachineNumber, True)
    End Sub
End Class