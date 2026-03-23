/**
 * Secure XML Validator for Biometric Device SDK
 * 
 * This wrapper validates and sanitizes XML messages before passing them
 * to the vulnerable Terminal.cs SDK to prevent XXE and code injection attacks.
 * 
 * SECURITY: CWE-94 Mitigation - Code Injection Prevention
 */

using System;
using System.IO;
using System.Text;
using System.Xml;
using System.Text.RegularExpressions;

namespace LogServerApp.Security
{
    public class SecureXmlValidator
    {
        private const int MaxMessageSize = 2048 + 8 * 1024 * 2; // 18K
        private static readonly Regex DangerousPatterns = new Regex(
            @"<!DOCTYPE|<!ENTITY|SYSTEM|PUBLIC|\[CDATA\[",
            RegexOptions.IgnoreCase | RegexOptions.Compiled
        );

        /// <summary>
        /// Validates and sanitizes XML message before processing
        /// </summary>
        /// <param name="xmlMessage">Raw XML message from biometric device</param>
        /// <param name="sanitizedXml">Sanitized XML output</param>
        /// <returns>True if valid, False if malicious</returns>
        public static bool ValidateAndSanitize(string xmlMessage, out string sanitizedXml)
        {
            sanitizedXml = null;

            try
            {
                // 1. Null/Empty check
                if (string.IsNullOrWhiteSpace(xmlMessage))
                {
                    LogSecurityEvent("Empty XML message received");
                    return false;
                }

                // 2. Size check
                if (xmlMessage.Length > MaxMessageSize)
                {
                    LogSecurityEvent($"XML message too large: {xmlMessage.Length} bytes");
                    return false;
                }

                // 3. Check for dangerous patterns
                if (DangerousPatterns.IsMatch(xmlMessage))
                {
                    LogSecurityEvent("Potentially malicious XML pattern detected");
                    LogSecurityEvent($"Blocked message: {xmlMessage.Substring(0, Math.Min(200, xmlMessage.Length))}...");
                    return false;
                }

                // 4. Validate XML structure with secure settings
                XmlReaderSettings settings = new XmlReaderSettings
                {
                    DtdProcessing = DtdProcessing.Prohibit,  // Disable DTD
                    XmlResolver = null,  // Disable external resources
                    MaxCharactersFromEntities = 1024,  // Limit entity expansion
                    IgnoreComments = true,
                    IgnoreProcessingInstructions = true,
                    IgnoreWhitespace = true
                };

                using (StringReader stringReader = new StringReader(xmlMessage))
                using (XmlReader reader = XmlReader.Create(stringReader, settings))
                {
                    // Parse and validate
                    XmlDocument doc = new XmlDocument();
                    doc.Load(reader);

                    // 5. Validate expected structure
                    if (doc.DocumentElement == null || doc.DocumentElement.Name != "Message")
                    {
                        LogSecurityEvent("Invalid XML structure - missing Message root element");
                        return false;
                    }

                    // 6. Validate allowed elements
                    if (!ValidateAllowedElements(doc))
                    {
                        LogSecurityEvent("XML contains unexpected elements");
                        return false;
                    }

                    // 7. Return sanitized XML
                    sanitizedXml = doc.OuterXml;
                    return true;
                }
            }
            catch (XmlException ex)
            {
                LogSecurityEvent($"XML parsing error: {ex.Message}");
                return false;
            }
            catch (Exception ex)
            {
                LogSecurityEvent($"Unexpected error during XML validation: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Validates that XML only contains allowed elements
        /// </summary>
        private static bool ValidateAllowedElements(XmlDocument doc)
        {
            // Whitelist of allowed element names from biometric device
            string[] allowedElements = new string[]
            {
                "Message", "TerminalType", "TerminalID", "DeviceSerialNo", "TransID",
                "Event", "Year", "Month", "Day", "Hour", "Minute", "Second",
                "UserID", "DoorID", "AttendStat", "VerifMode", "JobCode", "APStat",
                "Photo", "LogImage", "AdminID", "Action", "Stat", "Type",
                "Request"
            };

            foreach (XmlNode node in doc.SelectNodes("//*"))
            {
                bool isAllowed = false;
                foreach (string allowed in allowedElements)
                {
                    if (node.Name.Equals(allowed, StringComparison.OrdinalIgnoreCase))
                    {
                        isAllowed = true;
                        break;
                    }
                }

                if (!isAllowed)
                {
                    LogSecurityEvent($"Unexpected XML element: {node.Name}");
                    return false;
                }
            }

            return true;
        }

        /// <summary>
        /// Logs security events for monitoring
        /// </summary>
        private static void LogSecurityEvent(string message)
        {
            string timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
            string logMessage = $"[SECURITY] {timestamp} - {message}";
            
            Console.WriteLine(logMessage);
            
            // TODO: Send to security monitoring system
            // TODO: Write to security log file
            // TODO: Alert security team if critical
            
            try
            {
                string logFile = Path.Combine(
                    AppDomain.CurrentDomain.BaseDirectory,
                    "security_logs",
                    $"security_{DateTime.Now:yyyyMMdd}.log"
                );

                Directory.CreateDirectory(Path.GetDirectoryName(logFile));
                File.AppendAllText(logFile, logMessage + Environment.NewLine);
            }
            catch
            {
                // Don't fail if logging fails
            }
        }

        /// <summary>
        /// Creates a safe XML reader with security settings
        /// </summary>
        public static XmlReader CreateSecureXmlReader(string xmlMessage)
        {
            XmlReaderSettings settings = new XmlReaderSettings
            {
                DtdProcessing = DtdProcessing.Prohibit,
                XmlResolver = null,
                MaxCharactersFromEntities = 1024,
                IgnoreComments = true,
                IgnoreProcessingInstructions = true
            };

            StringReader stringReader = new StringReader(xmlMessage);
            return XmlReader.Create(stringReader, settings);
        }
    }

    /// <summary>
    /// Extension methods for secure XML processing
    /// </summary>
    public static class SecureXmlExtensions
    {
        /// <summary>
        /// Safely loads XML with security checks
        /// </summary>
        public static bool SafeLoad(this XmlDocument doc, string xmlMessage)
        {
            string sanitizedXml;
            if (!SecureXmlValidator.ValidateAndSanitize(xmlMessage, out sanitizedXml))
            {
                return false;
            }

            using (XmlReader reader = SecureXmlValidator.CreateSecureXmlReader(sanitizedXml))
            {
                doc.Load(reader);
                return true;
            }
        }
    }
}
