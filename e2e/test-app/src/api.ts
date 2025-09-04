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
  birthdate?: string;
  hiringDate?: string;
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
    console.log(JSON.stringify(allPersons));
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
        person.status.toLowerCase().includes(searchTerm)
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
