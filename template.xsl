<?xml version="1.0"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
	<!--
/*
 * WMISoftwareAudit/template.xsl
 * This file is part of WMISoftwareAudit
 *
 * Copyright (C) 2010 - Zenobius Jiricek
 *
 * WMISoftwareAudit is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * WMISoftwareAudit is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with WMISoftwareAudit; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, 
 * Boston, MA  02110-1301  USA
 */
	-->
  <xsl:template match="/root">
		<html>
			<head>
				<title>Software Audit for <xsl:value-of select="@machine"/></title>
				<link rel="stylesheet" href="../style.css"/>
			</head>
			<body>
				<div class="header">
				<h1>Software Audit for <xsl:value-of select="@machine"/></h1>
					<div class="table width-40-60">
						<dl>
							<dt><span>Date</span></dt>
							<dd><span><xsl:value-of select="@created"/></span></dd>
							<dt><span>Machine</span></dt>
							<dd><span><xsl:value-of select="@machine"/></span></dd>
							<dt><span>Operating System</span></dt>
							<dd><span><xsl:value-of select="//group[@name=operatingsystem]/field"/></span></dd>
						</dl>
					</div>
				</div>
				<xsl:for-each select="//group">
					<div class="group">
						<h2 class="group-title"><xsl:value-of select="./@name"/></h2>
						<table>
							<thead class="table-head">
							
								<xsl:for-each select="./fields/fieldName">
									<td><xsl:value-of select="@name"/></td>
								</xsl:for-each>
								
							</thead>
							<tbody>
							
								<xsl:for-each select="./item">
									<tr>
									<xsl:for-each select="./field">
										<td><xsl:value-of select="@value"/></td>
									</xsl:for-each>
									</tr>
								</xsl:for-each>
								
							</tbody>
						</table>
					</div>
				</xsl:for-each>
			</body>
		</html>
  </xsl:template>
  
</xsl:stylesheet>
