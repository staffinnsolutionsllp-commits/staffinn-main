using System;
using System.Collections.Generic;
using System.Text;
using System.IO;
using System.Threading;
using System.Net;
using System.Net.Sockets;
using System.Xml;

namespace LogServerApp
{
	// Terminal class
	class Terminal : IDisposable
    {
		public Boolean disposed;		// Is terminal disposed?
		public TcpClient client;		// Client object of terminal
		public NetworkStream stream;	// Network stream
		public Timer timerAlive;		// Alive watch timer
		public Byte[] message;			// Message buffer
		public Byte[] messageAccumulated;// Accumulated message buffer
		public int messageAccumulatedLen;// Accumulated message length

		private const int MaxMessageSize = 2048 + 8 * 1024 * 2;		// Maximum message size // 18K
		private const int PingTimeout = 30 * 1000;	// Ping timeout

		// Clean up client
		private void CleanUp(Boolean disposing)
		{
			if (this.disposed)
				return;

			this.disposed = true;

			if (disposing)
			{
				// Dispose client objects
				timerAlive.Change(Timeout.Infinite, Timeout.Infinite);
				try
				{
					stream.Close();
					client.Close();
				}
				catch { }
			}
		}

		public void Dispose()
		{
			CleanUp(true);
		}

        public Terminal()
        {
			disposed = false;

			// Message buffer
			message = new Byte[MaxMessageSize];
			messageAccumulated = new Byte[MaxMessageSize];
			messageAccumulatedLen = 0;

			timerAlive = new Timer(
				new TimerCallback(this.OnAliveTimerExpired));
			RestartAliveTimer();
		}

		~Terminal()
		{
			CleanUp(false);
		}

		// When alive timer is expired
		public void OnAliveTimerExpired(Object stateInfo)
		{
			this.Dispose();
		}

		// Restart alive timer
		public void RestartAliveTimer()
		{
			timerAlive.Change(PingTimeout, Timeout.Infinite);
		}

		// Establish connection to terminal
		public void EstablishConnect(TcpClient client_)
		{
			client = client_;
			stream = client.GetStream();

			RestartAliveTimer();
			stream.BeginRead(message, 0, MaxMessageSize,
				new AsyncCallback(Terminal.OnReceive), this);
		}

		// Send the stream to terminal
		public static void OnSend(IAsyncResult iar)
		{
			Terminal term = (Terminal)iar.AsyncState;
			try
			{
				term.stream.EndWrite(iar);
			}
			catch
			{
			}
		}

		// Predicate for end of message
		private static Boolean PreEndMessage(Byte c)
		{
			return (c == 0);
		}

		private string GetElementValue(XmlDocument doc, string elementName)
		{
			foreach(XmlElement x in doc.DocumentElement.ChildNodes)
			{
				if(x.Name == elementName)
					return x.InnerText;
			}
			throw new Exception();
		}
		// Process a message
		private void ProcMessage(string message)
		{
			XmlDocument doc = new XmlDocument();

			const ulong invalid_val64 = 0xFFFFFFFFFFFFFFFF;
			const uint invalid_val = 0xFFFFFFFF;
			string termType = null, serial = null, eventType = null, dispMessage = null;
			uint termID = invalid_val, transID = invalid_val;
            uint year = invalid_val, month = invalid_val, day = invalid_val, 
                hour = invalid_val, minute = invalid_val, second = invalid_val;

			doc.Load(new StringReader(message));

			// Terminal type
			try
			{
				termType = GetElementValue(doc, "TerminalType");
			}
			catch (System.Exception)
			{
				termType = "";
			}

			// Terminal ID
			try
			{
				termID = uint.Parse(GetElementValue(doc, "TerminalID"));
			}
			catch (System.Exception){ }

			// Serial Number
			try
			{
				serial = GetElementValue(doc, "DeviceSerialNo");
			}
			catch (System.Exception){ }

			// Transaction ID
			try
			{
				transID = uint.Parse(GetElementValue(doc, "TransID"));
			}
			catch (System.Exception){ }

			// Event
			try
			{
				eventType = GetElementValue(doc, "Event");
			}
			catch (System.Exception){ }

			// Termianl Type
			dispMessage = "[" + termType + ":";

			// Terminal ID
			if (termID != invalid_val)
				dispMessage += termID.ToString();

			// Serial Number
			if (serial != null)
				dispMessage += " SN=" + serial + "] ";
			else
				dispMessage += "] ";

			// Event Type
			if (eventType != null)
				dispMessage += eventType;

			string attendStat = null, verifMode = null, 
				apStat = null, photo = null, action = null, alarmType = null, LogImage = null;
            Byte[] photo_data = null;
			ulong userID = invalid_val64, adminID = invalid_val64;
			uint actionStat = invalid_val, doorID = invalid_val, jobCode = invalid_val;
			string msgReply = "<?xml version=\"1.0\"?><Message>";
			switch (eventType)
			{
				case "TimeLog":
					// Date and time of log
                    // Year
                    try
                    {
                        year = uint.Parse(GetElementValue(doc, "Year"));
                    }
                    catch (System.Exception) { }

                    // Month
                    try
                    {
                        month = uint.Parse(GetElementValue(doc, "Month"));
                    }
                    catch (System.Exception) { }

                    // Day
                    try
                    {
                        day = uint.Parse(GetElementValue(doc, "Day"));
                    }
                    catch (System.Exception) { }

                    // Hour
                    try
                    {
                        hour = uint.Parse(GetElementValue(doc, "Hour"));
                    }
                    catch (System.Exception) { }

                    // Minute
                    try
                    {
                        minute = uint.Parse(GetElementValue(doc, "Minute"));
                    }
                    catch (System.Exception) { }

                    // Second
                    try
                    {
                        second = uint.Parse(GetElementValue(doc, "Second"));
                    }
                    catch (System.Exception) { }


					// User ID
					try
					{
						userID = ulong.Parse(GetElementValue(doc, "UserID"));
					}
					catch (System.Exception){}

					// Door ID
					try
					{
						doorID = uint.Parse(GetElementValue(doc, "DoorID"));
					}
					catch (System.Exception){}

					// Time attendance status
					try
					{
						attendStat = GetElementValue(doc, "AttendStat");
					}
					catch (System.Exception){}

					// Verification mode
					try
					{
						verifMode = GetElementValue(doc, "VerifMode");
					}
					catch (System.Exception){}

					// Job code
					try
					{
						jobCode = uint.Parse(GetElementValue(doc, "JobCode"));
					}
					catch (System.Exception){}

					// Antipass status
					try
					{
						apStat = GetElementValue(doc, "APStat");
					}
					catch (System.Exception){}

					// Photo taken
					try
					{
						photo = GetElementValue(doc, "Photo");
					}
					catch (System.Exception){}

                    try
                    {
                        LogImage = GetElementValue(doc, "LogImage");
                        if (LogImage != null)
                            photo_data = Convert.FromBase64String(LogImage);
                    }
                    catch (System.Exception) { }

					if (transID != invalid_val)
						dispMessage += "(" + transID.ToString() + ") ";
                    if (year != invalid_val && month != invalid_val && day != invalid_val &&
                        hour != invalid_val && minute != invalid_val && second != invalid_val)
                        dispMessage += " AT " + year.ToString() + "/" + month.ToString() + "/" + day.ToString() + " " +
                            hour.ToString() + ":" + minute.ToString() + ":" + second.ToString() + ", ";
					if (userID != invalid_val64)
						dispMessage += "UserID=" + String.Format("{0}, ", userID);
					if (doorID != invalid_val)
						dispMessage += "DoorID=" + doorID.ToString() + ", ";
					if (attendStat != null)
						dispMessage += "AttendStat=" + attendStat + ", ";
					if (verifMode != null)
						dispMessage += "VerifMode=" + verifMode + ", ";
					if (jobCode != invalid_val)
						dispMessage += "JobCode=" + jobCode.ToString() + ", ";
					if (apStat != null)
						dispMessage += "APStatus=" + apStat + ", ";
					if (photo != null)
                        dispMessage += "PhotoTaken=" + photo + ", ";
                    if (photo_data != null)
                        dispMessage += "LogImage=(" + Convert.ToString(photo_data.Length) + "bytes)";

					// Concatenate a message to send back
					msgReply += "<Request>UploadedLog</Request><TransID>" +
						transID.ToString() + "</TransID></Message>";

					break;

				case "AdminLog":
					// Date and time of log
                    // Year
                    try
                    {
                        year = uint.Parse(GetElementValue(doc, "Year"));
                    }
                    catch (System.Exception) { }

                    // Month
                    try
                    {
                        month = uint.Parse(GetElementValue(doc, "Month"));
                    }
                    catch (System.Exception) { }

                    // Day
                    try
                    {
                        day = uint.Parse(GetElementValue(doc, "Day"));
                    }
                    catch (System.Exception) { }

                    // Hour
                    try
                    {
                        hour = uint.Parse(GetElementValue(doc, "Hour"));
                    }
                    catch (System.Exception) { }

                    // Minute
                    try
                    {
                        minute = uint.Parse(GetElementValue(doc, "Minute"));
                    }
                    catch (System.Exception) { }

                    // Second
                    try
                    {
                        second = uint.Parse(GetElementValue(doc, "Second"));
                    }
                    catch (System.Exception) { }

					// Administrator ID
					try
					{
						adminID = ulong.Parse(GetElementValue(doc, "AdminID"));
					}
					catch (System.Exception){}

					// User ID
					try
					{
						userID = ulong.Parse(GetElementValue(doc, "UserID"));
					}
					catch (System.Exception){}

					// Action
					try
					{
						action = GetElementValue(doc, "Action");
					}
					catch (System.Exception){}

					// Action status
					try
					{
						actionStat = uint.Parse(GetElementValue(doc, "Stat"));
					}
					catch (System.Exception){}

					if (transID != invalid_val)
						dispMessage += "(" + transID.ToString() + ") ";
					if (year != invalid_val && month != invalid_val && day != invalid_val &&
						hour != invalid_val && minute != invalid_val && second != invalid_val)
						dispMessage += " AT " + year.ToString() + "/" + month.ToString() + "/" + day.ToString() + " " +
							hour.ToString() + ":" + minute.ToString() + ":" + second.ToString() + ", ";
					if (adminID != invalid_val64)
						dispMessage += "AdminID=" + String.Format("{0}, ", adminID);
					if (userID != invalid_val64)
						dispMessage += "UserID=" + String.Format("{0}, ", userID);
					if (action != null)
						dispMessage += "Action=" + action + ", ";
					if (actionStat != invalid_val)
						dispMessage += "Status=" + String.Format("{0:D}", actionStat);

					// Concatenate a message to send back
					msgReply += "<Request>UploadedLog</Request><TransID>" +
						transID.ToString() + "</TransID></Message>";
					break;

				case "Alarm":
					// Year
					try
					{
						year = uint.Parse(GetElementValue(doc, "Year"));
					}
					catch (System.Exception) { }

					// Month
					try
					{
						month = uint.Parse(GetElementValue(doc, "Month"));
					}
					catch (System.Exception) { }

					// Day
					try
					{
						day = uint.Parse(GetElementValue(doc, "Day"));
					}
					catch (System.Exception) { }

					// Hour
					try
					{
						hour = uint.Parse(GetElementValue(doc, "Hour"));
					}
					catch (System.Exception) { }

					// Minute
					try
					{
						minute = uint.Parse(GetElementValue(doc, "Minute"));
					}
					catch (System.Exception) { }

					// Second
					try
					{
						second = uint.Parse(GetElementValue(doc, "Second"));
					}
					catch (System.Exception) { }

					// User ID
					try
					{
						userID = ulong.Parse(GetElementValue(doc, "UserID"));
					}
					catch (System.Exception){}

					// Door ID
					try
					{
						doorID = uint.Parse(GetElementValue(doc, "DoorID"));
					}
					catch (System.Exception){}

					// Time attendance status
					try
					{
						alarmType = GetElementValue(doc, "Type");
					}
					catch (System.Exception){}

					if (transID != invalid_val)
						dispMessage += "(" + transID.ToString() + ") ";
                    if (year != invalid_val && month != invalid_val && day != invalid_val &&
                        hour != invalid_val && minute != invalid_val && second != invalid_val)
                        dispMessage += " AT " + year.ToString() + "/" + month.ToString() + "/" + day.ToString() + " " +
                            hour.ToString() + ":" + minute.ToString() + ":" + second.ToString() + ", ";
					if (userID != invalid_val64)
						dispMessage += "UserID=" + String.Format("{0}, ", userID);
					if (doorID != invalid_val)
						dispMessage += "DoorID=" + doorID.ToString() + ", ";
					if (alarmType != null)
						dispMessage += "Type=" + alarmType;

					// Concatenate a message to send back
					msgReply += "<Request>UploadedLog</Request><TransID>" +
						transID.ToString() + "</TransID></Message>";

					break;

				case "KeepAlive":
					// Concatenate a message to send back
					msgReply += "<Request>KeptAlive</Request><TransID>" +
						transID.ToString() + "</TransID></Message>";
					break;
			}

			// Reply the message
			byte[] buffer = new byte[msgReply.Length + 1];
			System.Text.Encoding.ASCII.GetBytes(msgReply).CopyTo(buffer, 0);
			buffer[msgReply.Length] = 0;         // Insert null character as end token of message
			stream.BeginWrite(buffer,
				0, buffer.Length, new AsyncCallback(Terminal.OnSend), this);

			// Display the message on the form
			MainForm.theForm.BeginInvoke(
				MainForm.theForm.theDelegateAppendMessage, dispMessage);
		}

		public Boolean ProcStream(out Int32 consumed)
		{
			consumed = 0;
			Byte[] data = messageAccumulated;
			int size = messageAccumulatedLen;

			if (messageAccumulatedLen == MaxMessageSize)
				return false;

			Int32 end = Array.FindIndex(data, 0, messageAccumulatedLen, PreEndMessage);
			if (end == -1)
			{
				consumed = 0;
				return true;
			}

			ProcMessage(System.Text.Encoding.ASCII.GetString(data, 0, end));

			for (; end < messageAccumulatedLen; end++)
			{
				if (data[end] != 0)
					break;
			}
			if (end != messageAccumulatedLen)
				end++;
			consumed = end;

			return true;
		}

		public static void OnReceive(IAsyncResult iar)
		{
			Terminal term = (Terminal)iar.AsyncState;

			int rcv;
			try
			{
				rcv = term.stream.EndRead(iar);
				if (rcv <= 0)
					throw new Exception("connection closed");

				// Accumulate message
				Array.Copy(term.message, 0, 
					term.messageAccumulated, term.messageAccumulatedLen, rcv);
				term.messageAccumulatedLen += rcv;

				while (term.messageAccumulatedLen > 0)
				{
					int consumed;

					// Process stream
					if (!term.ProcStream(out consumed))
						throw new Exception("handle failed");

					// Trim consumed stream
					if (consumed > 0)
					{
						term.messageAccumulatedLen -= consumed;
						Array.Copy(term.messageAccumulated,
							consumed, term.messageAccumulated,
							0, term.messageAccumulatedLen);
					}
					else
					{
						break;
					}
				}

				// Restart alive timer
				term.RestartAliveTimer();
				term.stream.BeginRead(term.message, 0, MaxMessageSize,
					new AsyncCallback(Terminal.OnReceive), term);
			}
			catch
			{
				term.Dispose();
			}
		}
    }
}
