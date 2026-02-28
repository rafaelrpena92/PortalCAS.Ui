import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from "@angular/material/icon";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../Services/user.service';
import { PagerRequest } from '../../../Models/Contracts/pagerRequest.model';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';


@Component({
  selector: 'app-user-config',
  imports: [MatButtonModule, MatIcon, FormsModule, CommonModule, MatPaginatorModule],
  templateUrl: './user-config.component.html',
  styleUrl: './user-config.component.css'
})
export class UserConfigComponent {

  _userService = inject(UserService);
  email: string = '';
  pagerResponse : any;

  pageSizeOptions = [5, 10, 25, 100];

  pagerRequest: PagerRequest = {
    pageNumber: 1,
    pageSize: 5
  };

  constructor(private _intl: MatPaginatorIntl) {
  this._intl.itemsPerPageLabel = '';
  this._intl.nextPageLabel = 'Próxima página';
  this._intl.previousPageLabel = 'Página anterior';
  this.searchUsers()
  // Se quiser mudar o "of" (ex: 1-5 de 10), precisaria de uma função mais complexa, 
  // mas o rótulo inicial é esse acima.
}

  searchUsers() {
    this._userService.searchUsers(this.pagerRequest, this.email).subscribe({
      next: (res) => {
        this.pagerResponse = res;
        console.log('Dados recebidos:', this.pagerResponse);
      },
      error: (err) => console.error(err)
    });
  }

  changePage(newPage: number) {
    this.pagerRequest.pageNumber = newPage;
    this.searchUsers();
  }

 get totalPaginas(): number {
    if (!this.pagerResponse) return 0;
    
    const total = this.pagerResponse.totalRows || 0;
    const size = this.pagerRequest.pageSize;
    return Math.ceil(total / size);
  }

  handlePageEvent(e: PageEvent) {
    this.pagerRequest.pageNumber = e.pageIndex + 1; // Material 0 -> Backend 1
    this.pagerRequest.pageSize = e.pageSize;
    this.searchUsers();
  }

  onSearchClick() {
    this.pagerRequest.pageNumber = 1;
    this.searchUsers();
  }
}
