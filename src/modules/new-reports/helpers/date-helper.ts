// Helper para manejar fechas en zona horaria de Cuba
export class CubaDateHelper {
    // Obtener inicio del día en hora de Cuba
    static getStartOfDay(date: Date): Date {
        const cubaDate = new Date(date);
        cubaDate.setHours(0, 0, 0, 0);
        return cubaDate;
    }

    // Obtener fin del día en hora de Cuba
    static getEndOfDay(date: Date): Date {
        const cubaDate = new Date(date);
        cubaDate.setHours(23, 59, 59, 999);
        return cubaDate;
    }

    // Formatear fecha para mostrar en reportes
    static formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    }

    // Formatear fecha para usar en queries (YYYY-MM-DD)
    static formatForQuery(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Crear fecha a partir de string (YYYY-MM-DD) en hora de Cuba
    static fromDateString(dateStr: string): Date {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    }
}