import { ColumnFiltersState, SortingState } from "@tanstack/react-table";
import { users } from "./users";

// Sample data type
export type Person = {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
  status: "active" | "inactive";
  email: string;
  birthdate: string;
  hiringDate: string;
  salary: number;
  teams: string[];
};

// API Request/Response types
export interface PersonsRequest {
  pagination: {
    pageIndex: number;
    pageSize: number;
  };
  sorting: SortingState;
  filters: ColumnFiltersState;
  globalFilter: string;
}

export interface PersonsResponse {
  data: Person[];
  pageCount: number;
  rowCount: number;
}

// Store generated data
let allPersons: Person[] = [];

// Helper function to check if filter value is empty
function isEmptyFilterValue(value: unknown) {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  return false;
}

// Mock API function for fetching persons with server-side processing
export const fetchPersons = async (
  request: PersonsRequest
): Promise<PersonsResponse> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Generate data if not already done
  if (allPersons.length === 0) {
    allPersons = users as Person[];
  }

  let filteredPersons = [...allPersons];

  // Apply global filter first
  if (request.globalFilter) {
    const searchTerm = request.globalFilter.toLowerCase();
    filteredPersons = filteredPersons.filter(
      (person) =>
        person.firstName.toLowerCase().includes(searchTerm) ||
        person.lastName.toLowerCase().includes(searchTerm) ||
        person.email.toLowerCase().includes(searchTerm) ||
        person.status.toLowerCase().includes(searchTerm) ||
        person.teams.some(team => team.toLowerCase().includes(searchTerm))
    );
  }

  // Apply column filters
  request.filters.forEach((filter) => {
    // Skip empty filters
    if (isEmptyFilterValue(filter.value)) {
      return;
    }

    if (filter.id === "age") {
      const age = Number(filter.value);
      if (!isNaN(age)) {
        filteredPersons = filteredPersons.filter(
          (person) => person.age === age
        );
      }
    }

    if (filter.id === "status") {
      const status = filter.value as string;
      filteredPersons = filteredPersons.filter(
        (person) => person.status === status
      );
    }

    if (filter.id === "birthdate") {
      const filterDate = new Date(filter.value as string);
      filteredPersons = filteredPersons.filter((person) => {
        const birthdate = new Date(person.birthdate);
        return birthdate.toDateString() === filterDate.toDateString();
      });
    }

    if (filter.id === "hiringDate") {
      // Handle both tuple [from, to] and object {from, to} formats
      let from: string | undefined;
      let to: string | undefined;
      
      if (Array.isArray(filter.value)) {
        [from, to] = filter.value;
        // Convert empty string placeholders back to undefined
        if (from === "") from = undefined;
        if (to === "") to = undefined;
        
        // Skip processing if both values are placeholders (effectively empty filter)
        if (from === undefined && to === undefined) {
          return;
        }
      } else if (filter.value && typeof filter.value === 'object') {
        const obj = filter.value as { from?: string; to?: string };
        from = obj.from;
        to = obj.to;
      }
      
      filteredPersons = filteredPersons.filter((person) => {
        const hiringDate = new Date(person.hiringDate);
        
        if (from && to) {
          const fromDate = new Date(from);
          const toDate = new Date(to);
          return hiringDate >= fromDate && hiringDate <= toDate;
        } else if (from) {
          const fromDate = new Date(from);
          return hiringDate >= fromDate;
        } else if (to) {
          const toDate = new Date(to);
          return hiringDate <= toDate;
        }
        return true;
      });
    }

    if (filter.id === "salary") {
      // Handle both tuple [min, max] and object {min, max} formats
      let min: number | undefined;
      let max: number | undefined;
      
      if (Array.isArray(filter.value)) {
        // Always use [min, max] order
        min = filter.value[0];
        max = filter.value[1];
        
        // Convert -1 placeholders to undefined
        if (min === -1) min = undefined;
        if (max === -1) max = undefined;
        
        // Skip processing if no valid values
        if (min === undefined && max === undefined) {
          return;
        }
      } else if (filter.value && typeof filter.value === 'object') {
        ({ min, max } = filter.value as { min?: number; max?: number });
      }
      
      filteredPersons = filteredPersons.filter((person) => {
        if (min !== undefined && max !== undefined) {
          return person.salary >= min && person.salary <= max;
        } else if (min !== undefined) {
          return person.salary >= min;
        } else if (max !== undefined) {
          return person.salary <= max;
        }
        return true;
      });
    }

    if (filter.id === "teams") {
      const selectedTeams = filter.value as string[];
      filteredPersons = filteredPersons.filter((person) => {
        return selectedTeams.some(team => person.teams.includes(team));
      });
    }
  });

  // Apply sorting
  if (request.sorting.length > 0) {
    const sort = request.sorting[0];
    filteredPersons.sort((a, b) => {
      const aValue = a[sort.id as keyof Person];
      const bValue = b[sort.id as keyof Person];

      if (aValue < bValue) return sort.desc ? 1 : -1;
      if (aValue > bValue) return sort.desc ? -1 : 1;
      return 0;
    });
  }

  // Calculate pagination
  const { pageIndex, pageSize } = request.pagination;
  const startRow = pageIndex * pageSize;
  const endRow = startRow + pageSize;
  const paginatedPersons = filteredPersons.slice(startRow, endRow);

  return {
    data: paginatedPersons,
    pageCount: Math.ceil(filteredPersons.length / pageSize),
    rowCount: filteredPersons.length,
  };
};
