using System;
using System.Collections.Generic;
using System.Text;
using System.Net;
using System.Net.Sockets;
using System.Threading;
using System.IO;
using System.Runtime.InteropServices;
using System.Xml;

namespace LogServerApp
{
	class LogServer : IDisposable
    {
		public Boolean disposed;
		public Int32 portNum;
		public TcpListener theListener;
		static LinkedList<Terminal> listTerms = new LinkedList<Terminal>();

		private void CleanUp(bool disposing)
		{
			if (this.disposed)
				return;

			this.disposed = true;

			if (disposing)
			{
				// Dispose the listener and terminals.
				try
				{
					theListener.Stop();
					foreach (Terminal e in listTerms)
					{
						if (e != null)
							e.Dispose();
					}
				}
				catch { }
			}
		}

		public void Dispose()
		{
			CleanUp(true);
		}

		public LogServer(Int32 portNum_)
        {
			// Initialize objects.
			disposed = false;
			portNum = portNum_;

			// Start listener.
			theListener = new TcpListener(IPAddress.Any, portNum);
			theListener.Server.SetSocketOption(SocketOptionLevel.Socket,
				SocketOptionName.ReuseAddress, true);
			theListener.Start();

			// Begin accept.
			theListener.BeginAcceptTcpClient(
				new AsyncCallback(LogServer.OnAccept), this);
        }

		~LogServer()
		{
			CleanUp(false);
		}

		public static void OnAccept(IAsyncResult iar)
		{
			LogServer server = (LogServer)iar.AsyncState;
			Terminal term = new Terminal();
			
			try
			{
				// Establish connection and add a terminal into the list.
				term.EstablishConnect(
					server.theListener.EndAcceptTcpClient(iar));
				listTerms.AddLast(term);
			}
			catch
			{
				term.Dispose();
			}

			try
			{
				// For disposed listener.
				server.theListener.BeginAcceptTcpClient(
					new AsyncCallback(LogServer.OnAccept), server);
			}
			catch { }
		}
    }
}
