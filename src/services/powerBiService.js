import axios from 'axios';
import { ConfidentialClientApplication } from '@azure/msal-node';

class PowerBIService {
  constructor() {
    this.clientId = process.env.AZURE_CLIENT_ID;
    this.clientSecret = process.env.AZURE_CLIENT_SECRET;
    this.tenantId = process.env.AZURE_TENANT_ID;
    this.workspaceId = process.env.POWERBI_WORKSPACE_ID;
    this.scope = process.env.POWERBI_SCOPE || 'https://analysis.windows.net/powerbi/api/.default';
    this.powerBiApiUrl = 'https://api.powerbi.com/v1.0/myorg';
    
    // Inicializar cliente MSAL solo si las credenciales están disponibles
    this.clientApp = null;
    this.accessToken = null;
    this.tokenExpiry = null;
    
    // Solo inicializar MSAL si hay credenciales válidas
    if (this.isConfigured()) {
      this.initializeMSAL();
    }
  }

  /**
   * Inicializar el cliente MSAL con las credenciales
   */
  initializeMSAL() {
    if (!this.clientId || !this.clientSecret || !this.tenantId) {
      return;
    }

    // Para client_credentials, la authority debe ser el tenant específico, no "common"
    // Construir authority directamente con el tenant ID
    const authorityBase = 'https://login.microsoftonline.com';
    const authority = this.tenantId 
      ? `${authorityBase}/${this.tenantId}`
      : `${authorityBase}/common`; // Fallback solo si no hay tenant ID
    
    // Validar que tenantId no sea un valor reservado
    const reservedTenants = ['common', 'organizations', 'consumers'];
    if (reservedTenants.includes(this.tenantId.toLowerCase())) {
      console.warn('⚠️  Tenant ID no puede ser "common", "organizations" o "consumers" para client_credentials flow');
      return;
    }
    
    // Configuración de MSAL
    this.msalConfig = {
      auth: {
        clientId: this.clientId,
        authority: authority,
        clientSecret: this.clientSecret
      }
    };
    
    try {
      this.clientApp = new ConfidentialClientApplication(this.msalConfig);
    } catch (error) {
      console.error('⚠️  Error al inicializar MSAL:', error.message);
      this.clientApp = null;
    }
  }

  /**
   * Obtener token de acceso de Azure AD para Power BI
   */
  async getAccessToken() {
    try {
      // Verificar que MSAL esté inicializado
      if (!this.clientApp) {
        // Intentar inicializar si no está inicializado
        if (this.isConfigured()) {
          this.initializeMSAL();
        }
        
        if (!this.clientApp) {
          throw new Error('MSAL no está inicializado. Verifica las credenciales de Power BI.');
        }
      }

      // Si el token existe y no ha expirado, retornarlo
      if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
        return this.accessToken;
      }

      const clientCredentialRequest = {
        scopes: [this.scope]
      };

      const response = await this.clientApp.acquireTokenByClientCredential(clientCredentialRequest);
      
      if (response && response.accessToken) {
        this.accessToken = response.accessToken;
        // Establecer expiración 5 minutos antes de la expiración real para seguridad
        const expiresIn = response.expiresOn.getTime() - Date.now() - (5 * 60 * 1000);
        this.tokenExpiry = new Date(Date.now() + expiresIn);
        return this.accessToken;
      }

      throw new Error('No se pudo obtener el token de acceso');
    } catch (error) {
      console.error('Error al obtener token de acceso:', error);
      
      // Proporcionar mensajes de error más útiles
      if (error.errorCode === 'invalid_client' || error.message.includes('Invalid client secret')) {
        throw new Error('AZURE_CLIENT_SECRET inválido. Asegúrate de usar el VALUE (valor) del secreto, no el Secret ID. En Azure Portal: App registrations > Tu app > Certificates & secrets > Copia el VALUE cuando creas el secreto.');
      }
      
      throw new Error(`Error de autenticación con Power BI: ${error.message}`);
    }
  }

  /**
   * Hacer una petición autenticada a la API de Power BI
   */
  async makeAuthenticatedRequest(method, endpoint, data = null) {
    try {
      const token = await this.getAccessToken();
      
      const config = {
        method,
        url: `${this.powerBiApiUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error('Error en petición a Power BI API:', error.response?.data || error.message);
      
      // Extraer mensaje de error más específico
      const errorMessage = error.response?.data?.error?.message || error.message;
      
      // Si es un error de permisos específico, proporcionar ayuda
      if (errorMessage && errorMessage.includes('Only folder user with reshare permissions')) {
        throw new Error('Permisos insuficientes para generar embed tokens. Verifica: 1) Service Principal es Admin del workspace, 2) Workspace está en capacidad Premium (requerido para Service Principals con Pro).');
      }
      
      throw new Error(`Error en petición a Power BI: ${errorMessage}`);
    }
  }

  /**
   * Obtener todos los workspaces/grupos disponibles
   */
  async getWorkspaces() {
    try {
      const endpoint = '/groups';
      const response = await this.makeAuthenticatedRequest('GET', endpoint);
      
      return response.value.map(workspace => ({
        id: workspace.id,
        name: workspace.name,
        isReadOnly: workspace.isReadOnly,
        isOnDedicatedCapacity: workspace.isOnDedicatedCapacity,
        type: workspace.type
      }));
    } catch (error) {
      console.error('Error al obtener workspaces:', error);
      throw error;
    }
  }

  /**
   * Buscar un workspace por nombre (búsqueda exacta o parcial)
   */
  async findWorkspaceByName(workspaceName, exactMatch = true) {
    try {
      const workspaces = await this.getWorkspaces();
      
      if (exactMatch) {
        return workspaces.find(ws => ws.name === workspaceName || ws.name.toLowerCase() === workspaceName.toLowerCase());
      } else {
        // Búsqueda parcial (case insensitive)
        return workspaces.find(ws => 
          ws.name.toLowerCase().includes(workspaceName.toLowerCase()) ||
          workspaceName.toLowerCase().includes(ws.name.toLowerCase())
        );
      }
    } catch (error) {
      console.error('Error al buscar workspace por nombre:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los dashboards/reportes del workspace
   * @param {string} workspaceId - ID del workspace (opcional, usa el configurado por defecto)
   */
  async getDashboards(workspaceId = null) {
    try {
      const targetWorkspaceId = workspaceId || this.workspaceId;
      if (!targetWorkspaceId) {
        throw new Error('Workspace ID es requerido');
      }

      const endpoint = `/groups/${targetWorkspaceId}/reports`;
      const response = await this.makeAuthenticatedRequest('GET', endpoint);
      
      return response.value.map(report => ({
        id: report.id,
        name: report.name,
        embedUrl: report.embedUrl,
        workspaceId: report.workspaceId || targetWorkspaceId,
        webUrl: report.webUrl,
        datasetId: report.datasetId
      }));
    } catch (error) {
      console.error('Error al obtener dashboards:', error);
      throw error;
    }
  }

  /**
   * Obtener dashboards de un workspace por nombre de empresa
   * Busca un workspace cuyo nombre coincida con el nombre de la empresa
   */
  async getDashboardsByCompanyName(companyName, exactMatch = true) {
    try {
      const workspace = await this.findWorkspaceByName(companyName, exactMatch);
      
      if (!workspace) {
        throw new Error(`No se encontró ningún workspace con el nombre "${companyName}"`);
      }

      console.log(`📁 Workspace encontrado: ${workspace.name} (ID: ${workspace.id})`);
      
      const dashboards = await this.getDashboards(workspace.id);
      
      return {
        workspace: {
          id: workspace.id,
          name: workspace.name
        },
        dashboards
      };
    } catch (error) {
      console.error('Error al obtener dashboards por nombre de empresa:', error);
      throw error;
    }
  }

  /**
   * Obtener información de un dashboard específico
   */
  async getDashboardById(dashboardId) {
    try {
      const endpoint = `/groups/${this.workspaceId}/reports/${dashboardId}`;
      const report = await this.makeAuthenticatedRequest('GET', endpoint);
      
      return {
        id: report.id,
        name: report.name,
        embedUrl: report.embedUrl,
        workspaceId: report.workspaceId || this.workspaceId,
        webUrl: report.webUrl,
        datasetId: report.datasetId
      };
    } catch (error) {
      console.error('Error al obtener dashboard:', error);
      throw error;
    }
  }

  /**
   * Obtener información del workspace (para diagnóstico)
   */
  async getWorkspaceInfo() {
    try {
      const endpoint = `/groups/${this.workspaceId}`;
      const workspace = await this.makeAuthenticatedRequest('GET', endpoint);
      return workspace;
    } catch (error) {
      console.error('Error al obtener información del workspace:', error);
      throw error;
    }
  }

  /**
   * Generar embed token para un dashboard
   */
  async generateEmbedToken(reportId, accessLevel = 'View') {
    try {
      // Obtener información del reporte primero
      const report = await this.getDashboardById(reportId);
      
      // Crear la petición para generar el embed token
      // La estructura del request para Power BI embed tokens
      const embedTokenRequest = {
        accessLevel: accessLevel,
        allowSaveAs: accessLevel === 'Edit' ? true : false
      };

      const endpoint = `/groups/${this.workspaceId}/reports/${reportId}/GenerateToken`;
      const response = await this.makeAuthenticatedRequest('POST', endpoint, embedTokenRequest);

      // La respuesta de Power BI incluye el token y la expiración
      return {
        embedUrl: report.embedUrl,
        accessToken: response.token,
        embedId: reportId,
        expiration: response.expiration,
        tokenType: response.tokenType || 'Bearer'
      };
    } catch (error) {
      console.error('Error al generar embed token:', error);
      
      // Proporcionar mensajes de error más útiles
      if (error.message && error.message.includes('Only folder user with reshare permissions')) {
        const errorMsg = 'El Service Principal no tiene permisos para generar embed tokens.\n\n' +
          'Soluciones:\n' +
          '1. Verifica que el Service Principal sea Administrador del workspace:\n' +
          '   Power BI Service > Tu Workspace > ... > Workspace access > Agregar Service Principal como "Admin"\n\n' +
          '2. IMPORTANTE con Power BI Pro:\n' +
          '   Los Service Principals pueden tener limitaciones en espacios Pro compartidos.\n' +
          '   Asegúrate de que el workspace esté en una capacidad Premium (Premium Per User o Premium Per Capacity).\n' +
          '   O considera usar el flujo de autenticación de usuario en lugar de Service Principal.';
        throw new Error(errorMsg);
      }
      
      throw error;
    }
  }

  /**
   * Verificar si las credenciales están configuradas
   */
  isConfigured() {
    // Verificar que todas las credenciales necesarias estén presentes y no vacías
    const hasCredentials = !!(
      this.clientId && 
      this.clientSecret && 
      this.tenantId && 
      this.workspaceId &&
      this.clientId.trim() !== '' &&
      this.clientSecret.trim() !== '' &&
      this.tenantId.trim() !== '' &&
      this.workspaceId.trim() !== ''
    );
    
    // Validar que tenantId no sea un valor reservado para client_credentials
    if (hasCredentials && this.tenantId) {
      const reservedTenants = ['common', 'organizations', 'consumers'];
      if (reservedTenants.includes(this.tenantId.toLowerCase().trim())) {
        console.warn('⚠️  Tenant ID no puede ser "common", "organizations" o "consumers" para client_credentials flow');
        return false;
      }
      
      // Validar formato del client secret (debe ser un string largo, no un GUID)
      // Los secret IDs son GUIDs, los secret values son strings largos
      const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (this.clientSecret && guidPattern.test(this.clientSecret.trim())) {
        console.warn('⚠️  AZURE_CLIENT_SECRET parece ser un Secret ID (GUID). Debes usar el Secret VALUE (valor del secreto), no el ID.');
        console.warn('⚠️  Para obtener el valor correcto: Azure Portal > App registrations > Tu app > Certificates & secrets > Copia el VALUE (no el ID)');
        return false;
      }
    }
    
    return hasCredentials;
  }
}

// Singleton instance
export default new PowerBIService();

